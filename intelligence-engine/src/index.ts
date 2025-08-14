import cron from 'node-cron';
import { MemoryManager } from '../../src/memory/manager';
import { ChatOpenAI } from '@langchain/openai';
import dotenv from 'dotenv';

dotenv.config();

async function nightlyReflection() {
  console.log('Running nightly reflection job...');
  
  try {
    // Create memory manager and LLM
    const memoryManager = await MemoryManager.create();
    const llm = new ChatOpenAI({ 
      model: 'gpt-4o',
      temperature: 0.3, // Slightly creative for reflections
    });

    // 1. Retrieve recent, important memories
    const recentMemories = await memoryManager.retrieveMemories("summary of the last 24 hours", 20);

    if (recentMemories.length === 0) {
      console.log('No recent memories found for reflection.');
      return;
    }

    // 2. Craft a reflection prompt
    const reflectionPrompt = `
      You are a DeFi strategist. Based on the following recent activities and observations,
      generate 1-3 high-level insights, learned lessons, or emerging strategies.
      Be concise and focus on patterns or trends you notice.

      Activities:
      ${recentMemories.map(m => `- [${m.type}] ${m.content}`).join('\n')}
    `;

    // 3. Generate reflections
    const reflectionText = await llm.invoke(reflectionPrompt);
    
    if (reflectionText.content) {
      // 4. Save reflections as new, high-importance memories
      const reflectionId = await memoryManager.addMemory({
        content: reflectionText.content.toString(),
        type: 'reflection',
        importance: 1.0,
        metadata: { source: 'nightly_reflection_engine' }
      });
      
      console.log('Reflection saved with ID:', reflectionId);
    } else {
      console.log('No reflection content generated.');
    }
  } catch (error) {
    console.error('Nightly reflection failed:', error);
  }
  
  console.log('Nightly reflection job completed.');
}

// Schedule the nightly reflection for 2 AM every day
// cron.schedule('0 2 * * *', nightlyReflection);

// For testing purposes, run immediately
nightlyReflection();

// Export for potential use in other modules
export { nightlyReflection };