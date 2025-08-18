// Simple test to verify Jest setup
describe("Jest Setup Verification", () => {
  test("should run a basic test", () => {
    expect(1 + 1).toBe(2);
  });

  test("should handle string comparisons", () => {
    const greeting = "Hello, World!";
    expect(greeting).toContain("Hello");
    expect(greeting).toMatch(/World/);
  });

  test("should handle arrays", () => {
    const numbers = [1, 2, 3, 4, 5];
    expect(numbers).toContain(3);
    expect(numbers).toHaveLength(5);
  });

  test("should handle objects", () => {
    const user = {
      name: "Alice",
      age: 30,
      email: "alice@example.com"
    };
    
    expect(user).toHaveProperty("name", "Alice");
    expect(user).toHaveProperty("age");
    expect(user.age).toBeGreaterThan(18);
  });
});