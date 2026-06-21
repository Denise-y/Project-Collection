import os
import subprocess
import sys
import time
import webbrowser


def main() -> int:
    base_dir = os.path.dirname(os.path.abspath(sys.argv[0]))
    compose_file = os.path.join(base_dir, "docker-compose.yml")

    if not os.path.exists(compose_file):
        print("Error: docker-compose.yml not found in current directory.")
        print(f"Current directory: {base_dir}")
        return 1

    print("Starting IntelliSched services with Docker Compose...")
    print("Please keep this window open to keep services running.\n")

    try:
        proc = subprocess.Popen(
            ["docker", "compose", "up", "--build"],
            cwd=base_dir,
        )
    except FileNotFoundError:
        print("Error: Docker command not found. Please install Docker Desktop first.")
        return 1
    except Exception as exc:
        print(f"Error: failed to start Docker Compose: {exc}")
        return 1

    # Give the services a moment to boot, then open app pages.
    time.sleep(8)
    webbrowser.open("http://localhost:5173")
    webbrowser.open("http://localhost:8000/docs")

    try:
        return proc.wait()
    except KeyboardInterrupt:
        print("\nStopping services...")
        proc.terminate()
        return 0


if __name__ == "__main__":
    raise SystemExit(main())
