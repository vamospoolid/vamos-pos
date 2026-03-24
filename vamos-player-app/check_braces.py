import sys

def check_braces(filename):
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()
    
    stack = []
    line = 1
    col = 1
    
    in_string = False
    quote_char = ''
    escaped = False
    
    for i, char in enumerate(content):
        if char == '\n':
            line += 1
            col = 1
        else:
            col += 1
            
        if escaped:
            escaped = False
            continue
            
        if char == '\\':
            escaped = True
            continue
            
        if in_string:
            if char == quote_char:
                in_string = False
            continue
            
        if char in ('"', "'", '`'):
            in_string = True
            quote_char = char
            continue
            
        if char == '{':
            stack.append(('{', line, col))
        elif char == '}':
            if not stack:
                print(f"Extra closing brace at {line}:{col}")
            else:
                stack.pop()
        elif char == '(':
            stack.append(('(', line, col))
        elif char == ')':
            if not stack:
                print(f"Extra closing parenthesis at {line}:{col}")
            else:
                op, l, c = stack.pop()
                if op != '(':
                    print(f"Mismatched parenthesis: opened {op} at {l}:{c}, closed ) at {line}:{col}")

    while stack:
        op, l, c = stack.pop()
        print(f"Unclosed {op} at {l}:{c}")

if __name__ == "__main__":
    check_braces(sys.argv[1])
