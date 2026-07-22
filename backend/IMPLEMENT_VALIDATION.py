#!/usr/bin/env python3
"""
Implement comprehensive input validation for all DTOs
Smart approach: Read each DTO, add appropriate validations based on field patterns
"""

import os
import re
from pathlib import Path
from collections import defaultdict

BACKEND_DIR = Path("src/main/java/com/service/backend")

# Field patterns -> validation annotations
FIELD_PATTERNS = {
    # Email patterns
    ('email', 'String'): ['@Email(message = "Invalid email")'],
    ('mail', 'String'): ['@Email(message = "Invalid email")'],

    # Phone patterns
    ('phone', 'String'): ['@Pattern(regexp = "^0[35789]\\\\d{8}$", message = "Invalid phone")'],

    # ID patterns
    ('id', ('Integer', 'Long')): ['@NotNull(message = "ID required")', '@Min(value = 1)'],
    ('Id', ('Integer', 'Long')): ['@NotNull(message = "ID required")', '@Min(value = 1)'],
    ('organizationId', ('Integer', 'Long')): ['@NotNull', '@Min(value = 1)'],
    ('userId', ('Integer', 'Long')): ['@NotNull', '@Min(value = 1)'],

    # Required text fields
    ('name', 'String'): ['@NotBlank(message = "Required")', '@Size(min = 2, max = 100)'],
    ('title', 'String'): ['@NotBlank', '@Size(min = 2, max = 200)'],
    ('content', 'String'): ['@NotBlank', '@Size(min = 10, max = 5000)'],
    ('description', 'String'): ['@Size(max = 1000)'],
    ('bio', 'String'): ['@Size(max = 1000)'],

    # Collections
    ('ids', 'List'): ['@NotEmpty', '@Size(max = 100)'],
    ('Ids', 'List'): ['@NotEmpty', '@Size(max = 100)'],
    ('members', 'List'): ['@NotEmpty', '@Size(max = 100)'],
    ('questions', 'List'): ['@Size(max = 100)'],
    ('tags', 'List'): ['@Size(max = 100)'],
}

def extract_fields(content):
    """Extract field definitions from DTO"""
    pattern = r'private\s+(\w+(?:<[\w,\s]+>)?)\s+(\w+)\s*[;=]'
    matches = re.findall(pattern, content)
    return matches

def has_validation(content, field_name):
    """Check if field already has validation"""
    field_pattern = rf'private\s+\w+\s+{field_name}\s*[;=]'
    match = re.search(field_pattern, content)
    if not match:
        return False

    # Check if there's an annotation before it
    start_pos = match.start()
    before_text = content[:start_pos]
    last_newline = before_text.rfind('\n')
    if last_newline > 0:
        before_lines = before_text[max(0, last_newline-300):last_newline]
        if '@' in before_lines and any(x in before_lines for x in ['NotBlank', 'NotNull', 'Size', 'Pattern', 'Email']):
            return True

    return False

def get_validation_for_field(field_name, field_type):
    """Get validation for a field"""
    base_type = field_type.split('<')[0]

    # Check exact patterns first
    for (pattern, types), validations in FIELD_PATTERNS.items():
        if field_name == pattern or field_name.endswith(pattern):
            if isinstance(types, str):
                if base_type == types or field_type.startswith(types):
                    return validations
            else:
                if any(base_type == t or field_type.startswith(t) for t in types):
                    return validations

    # Check contains patterns
    for (pattern, types), validations in FIELD_PATTERNS.items():
        if pattern.lower() in field_name.lower():
            if isinstance(types, str):
                if base_type == types:
                    return validations
            else:
                if any(base_type == t for t in types):
                    return validations

    # Default by type
    if base_type == 'String':
        return ['@Size(max = 255)']
    elif base_type == 'List':
        return ['@Size(max = 100)']
    elif base_type in ('Integer', 'Long'):
        return ['@NotNull', '@Min(value = 1)']

    return []

def add_validations_to_file(filepath):
    """Add validations to a DTO file"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        # Skip if already has many validations
        if content.count('@') > 10:
            return 0

        # Skip non-Request DTOs
        if 'Request' not in filepath.name and 'Body' not in filepath.name:
            return 0

        fields = extract_fields(content)
        if not fields:
            return 0

        changes = 0
        original_content = content

        # Add import if needed
        if 'jakarta.validation.constraints' not in content:
            # Find last import line
            import_pattern = r'(import [^;]+;)(?!.*import [^;]+;)'
            match = re.search(import_pattern, content, re.DOTALL)
            if match:
                insert_pos = match.end()
                content = content[:insert_pos] + '\nimport jakarta.validation.constraints.*;' + content[insert_pos:]

        # Process each field
        for field_type, field_name in fields:
            if has_validation(content, field_name):
                continue

            validations = get_validation_for_field(field_name, field_type)
            if not validations:
                continue

            # Find the field declaration and add annotations before it
            field_pattern = rf'(\s+)(private\s+{re.escape(field_type)}\s+{field_name}\s*[;=])'

            def replace_field(match):
                indent = match.group(1)
                annotations = '\n'.join(f'{indent}{v}' for v in validations)
                return f'{annotations}\n{match.group(0)}'

            new_content = re.sub(field_pattern, replace_field, content)
            if new_content != content:
                content = new_content
                changes += 1

        # Write if changed
        if content != original_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            return changes

        return 0

    except Exception as e:
        return 0

def main():
    """Main function"""
    print("="*70)
    print("IMPLEMENTING VALIDATION FOR ALL REQUEST DTOs")
    print("="*70)
    print()

    # Find all Request DTOs
    dttos = list(BACKEND_DIR.glob('**/dto/*Request.java'))

    print(f"Found {len(dttos)} Request DTOs")
    print()

    # Process each DTO
    total_validations = 0
    processed = 0

    for dto in sorted(dttos):
        validations = add_validations_to_file(str(dto))
        if validations > 0:
            print(f"✓ {dto.parent.name:15} / {dto.name:40} ({validations} validations)")
            processed += 1
            total_validations += validations

    print()
    print("="*70)
    print(f"RESULTS:")
    print(f"  DTOs processed: {processed}/{len(dttos)}")
    print(f"  Total validations added: {total_validations}")
    print()
    print(f"Next: mvn clean compile")
    print("="*70)

if __name__ == '__main__':
    main()
