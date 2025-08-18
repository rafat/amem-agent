import { getChromaClient } from "../chroma";

async function testChromaDBDirect() {
  try {
    // Get the Chroma client
    const chroma = getChromaClient();

    // Try to delete the existing collection if it exists
    try {
      await chroma.deleteCollection({ name: "agent_memories" });
      console.log("Deleted existing collection");
    } catch (error) {
      console.log(
        "Collection doesn't exist or couldn't be deleted:",
        error.message,
      );
    }

    // Create a new collection
    const collection = await chroma.createCollection({
      name: "agent_memories",
    });
    console.log("New collection created successfully");

    // Generate a proper embedding using OpenAI
    const { OpenAIEmbeddings } = await import("@langchain/openai");
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY environment variable is not set");
    }

    const embeddings = new OpenAIEmbeddings({
      apiKey: apiKey,
      model: "text-embedding-ada-002",
    });

    // Generate embedding for our test document
    const testText = "This is a test document";
    const embedding = await embeddings.embedQuery(testText);
    console.log("Generated embedding with dimension:", embedding.length);

    // Add item with proper embedding
    const result = await collection.add({
      ids: ["test-id-1"],
      embeddings: [embedding],
      metadatas: [{ type: "test", importance: 0.5 }],
      documents: [testText],
    });

    console.log("Added item to collection:", result);

    // Try to query
    const queryEmbedding = await embeddings.embedQuery("test document");
    const queryResult = await collection.query({
      queryEmbeddings: [queryEmbedding],
      nResults: 1,
    });

    console.log("Query result:", queryResult);
  } catch (error) {
    console.error("Error testing ChromaDB directly:", error);
  }
}

// Run the test
testChromaDBDirect().catch(console.error);
