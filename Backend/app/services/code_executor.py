import time
import io
import sys
from contextlib import redirect_stdout, redirect_stderr
from app.models.schemas import ExecutionResult


class CodeExecutor:
    """Service for executing code in different languages."""
    
    SUPPORTED_LANGUAGES = [
        "javascript",
        "typescript",
        "python",
        "java",
        "cpp",
        "go",
        "rust"
    ]
    
    async def execute_code(self, code: str, language: str) -> ExecutionResult:
        """
        Execute code and return the result.
        
        Note: This is a mock implementation for demonstration.
        In production, use sandboxed containers (Docker, gVisor) or 
        services like Judge0, Piston API for secure code execution.
        """
        start_time = time.time()
        
        if language in ["javascript", "typescript"]:
            return await self._execute_javascript_mock(code, start_time)
        elif language == "python":
            return await self._execute_python(code, start_time)
        else:
            return await self._execute_mock(code, language, start_time)
    
    async def _execute_javascript_mock(self, code: str, start_time: float) -> ExecutionResult:
        """Mock JavaScript/TypeScript execution."""
        # For now, return mock output
        # In production, use Node.js subprocess or a JS engine
        output = "[Mock JavaScript Output]\nJavaScript execution is simulated.\n"
        output += f"Code received:\n{code[:100]}..."
        
        execution_time = int((time.time() - start_time) * 1000)
        
        return ExecutionResult(
            output=output,
            executionTime=execution_time
        )
    
    async def _execute_python(self, code: str, start_time: float) -> ExecutionResult:
        """
        Execute Python code in a restricted environment.
        
        WARNING: This is still not fully secure. For production, use:
        - Docker containers with resource limits
        - RestrictedPython library
        - External sandboxed execution services
        """
        output_buffer = io.StringIO()
        error_buffer = io.StringIO()
        error_msg = None
        
        try:
            # Redirect stdout and stderr
            with redirect_stdout(output_buffer), redirect_stderr(error_buffer):
                # Create a restricted namespace
                namespace = {
                    '__builtins__': {
                        'print': print,
                        'len': len,
                        'range': range,
                        'str': str,
                        'int': int,
                        'float': float,
                        'list': list,
                        'dict': dict,
                        'tuple': tuple,
                        'set': set,
                        'True': True,
                        'False': False,
                        'None': None,
                    }
                }
                
                # Execute the code
                exec(code, namespace)
        
        except Exception as e:
            error_msg = f"{type(e).__name__}: {str(e)}"
        
        output = output_buffer.getvalue()
        error_output = error_buffer.getvalue()
        
        if error_output and not error_msg:
            error_msg = error_output
        
        if not output and not error_msg:
            output = "No output"
        
        execution_time = int((time.time() - start_time) * 1000)
        
        return ExecutionResult(
            output=output or "No output",
            error=error_msg,
            executionTime=execution_time
        )
    
    async def _execute_mock(self, code: str, language: str, start_time: float) -> ExecutionResult:
        """Mock execution for unsupported languages."""
        output = f"[Mock {language.title()} Output]\n"
        output += f"Execution for {language} is simulated.\n"
        output += f"Code received:\n{code[:100]}..."
        
        execution_time = int((time.time() - start_time) * 1000)
        
        return ExecutionResult(
            output=output,
            executionTime=execution_time
        )
