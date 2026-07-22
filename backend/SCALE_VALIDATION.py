#!/usr/bin/env python3
"""Scale validation to all Request DTOs"""
import os
import re
from pathlib import Path

BACKEND_DIR = Path("src/main/java/com/service/backend")

VALIDATION_RULES = {
    'email': '@Email(message = "Invalid email")',
    'phone': '@Pattern(regexp = "^0[35789]\\\\d{8}$")',
    'name': '@NotBlank @Size(min=2, max=100)',
    'title': '@NotBlank @Size(min=2, max=200)',
    'content': '@NotBlank @Size(min=10, max=5000)',
    'description': '@Size(max=1000)',
    'bio': '@Size(max=1000)',
    'id': '@NotNull @Min(1)',
    'amount': '@Min(0)',
    'price': '@Min(0)',
}

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Skip if already has validations
    if '@NotBlank' in content or '@NotNull' in content:
        return False
    
    # Add basic validations
    changed = False
    
    # Add import if needed
    if 'jakarta.validation' not in content:
        content = content.replace(
            'import lombok.Data;',
            'import jakarta.validation.constraints.*;\nimport lombok.Data;'
        )
        changed = True
    
    # Add @Size to String fields
    content = re.sub(
        r'(\s+private String )(\w+);',
        r'\1\n    @Size(max = 255)\n    private String \2;',
        content
    )
    
    if content != open(filepath, 'r', encoding='utf-8').read():
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

# Find and process all DTOs
dttos = list(BACKEND_DIR.glob('**/dto/*Request.java'))
processed = 0

for dto in sorted(dttos)[:113]:
    if process_file(str(dto)):
        processed += 1
        print(f"✓ {dto.parent.name:15} / {dto.name}")

print(f"\nProcessed: {processed} DTOs")
print("Run: mvn clean compile")
