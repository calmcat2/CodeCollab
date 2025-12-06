import asyncio
from app.services.code_executor import CodeExecutor

async def main():
    executor = CodeExecutor()
    
    # Test 1: Python Success
    print("Testing Python Success...")
    result = await executor.execute_code('print("Hello World")', 'python')
    print(f"Result: output='{result.output}', error='{result.error}'")
    assert "Hello World" in result.output
    
    # Test 2: Python Error
    print("\nTesting Python Error...")
    result = await executor.execute_code('print(undefined_var)', 'python')
    print(f"Result: output='{result.output}', error='{result.error}'")
    assert result.error and "NameError" in result.error
    
    print("\n✅ Executor verification passed!")

if __name__ == "__main__":
    asyncio.run(main())
