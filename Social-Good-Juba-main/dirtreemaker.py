import os
from pathlib import Path

def print_tree(start_path, prefix="", ignore_dirs=['node_modules']):
    """Simple directory tree printer"""
    if any(ignore_dir in str(start_path) for ignore_dir in ignore_dirs):
        return
    
    items = []
    try:
        items = sorted(os.listdir(start_path))
    except PermissionError:
        print(f"{prefix}└── [Permission Denied]")
        return
    
    # Filter out ignored directories
    items = [item for item in items if item not in ignore_dirs]
    
    for i, item in enumerate(items):
        is_last = i == len(items) - 1
        item_path = os.path.join(start_path, item)
        
        print(f"{prefix}{'└── ' if is_last else '├── '}{item}")
        
        if os.path.isdir(item_path):
            extension = "    " if is_last else "│   "
            print_tree(item_path, prefix + extension, ignore_dirs)

if __name__ == "__main__":
    print(f"Directory tree for: {os.getcwd()}")
    print("(node_modules folder excluded)")
    print("-" * 50)
    print_tree(os.getcwd())