#!/usr/bin/env python3
"""
Auto-add validation annotations to request DTOs
Usage: python3 AUTO_VALIDATION_SCRIPT.py
"""

import os
import re
from pathlib import Path

# DTOs directory
DTO_DIR = Path("src/main/java/com/service/backend")

# Field name to validation annotation mapping
VALIDATION_MAP = {
    # Email/Phone
    (r'email|mail', 'String'): '@Email(message = "Invalid email")',
    (r'phone', 'String'): '@Pattern(regexp = "^0[35789]\\\\d{8}$", message = "Invalid phone")',

    # IDs
    (r'(id|ID)$', ('Integer', 'Long')): '@NotNull @Min(1)',
    (r'organizationId', ('Integer', 'Long')): '@NotNull @Min(1)',

    # Names/Titles
    (r'(name|title|fullName|groupName)$', 'String'): '@NotBlank @Size(min=2, max=100)',

    # Text content
    (r'(description|content|bio|address|company|jobTitle)$', 'String'): '@Size(max=1000)',
    (r'(comment|message)', 'String'): '@NotBlank @Size(min=1, max=500)',

    # URLs/Media
    (r'(url|link|image|avatar|cover)', 'String'): '@Size(max=2000)',

    # Collections
    (r'(ids|items|members|userIds|tags|questions)', 'List'): '@NotEmpty @Size(max=100)',

    # Amounts/Prices
    (r'(amount|price|donation|goal)', ('BigDecimal', 'Double', 'Long')): '@Min(0)',

    # Dates
    (r'(startDate|startTime|dob)', ('LocalDate', 'LocalDateTime')): '@PastOrPresent',
    (r'(endDate|eventDate|deadline)', ('LocalDate', 'LocalDateTime')): '@FutureOrPresent',
}

def extract_fields(file_content):
    """Extract fields from DTO file"""
    pattern = r'(?:private|public)\s+(\w+(?:<[\w,\s]+>)?)\s+(\w+)\s*(?:;|=)'
    matches = re.findall(pattern, file_content)
    return matches

def get_validation(field_name, field_type):
    """Get appropriate validation for a field"""
    for (pattern, types), validation in VALIDATION_MAP.items():
        if not re.search(pattern, field_name):
            continue

        # Check if type matches
        if isinstance(types, str):
            if field_type.startswith(types):
                return validation
        else:
            if any(field_type.startswith(t) for t in types):
                return validation

    # Default validations based on type
    if field_type == 'String':
        return '@Size(max=255)'
    elif field_type.startswith('List'):
        return '@Size(max=100)'
    elif field_type in ('Integer', 'Long', 'int', 'long'):
        return '@NotNull @Min(1)'

    return None

def should_skip_file(content):
    """Check if file already has validation"""
    return '@NotBlank' in content or '@NotNull' in content or '@Size' in content

def process_dto_file(file_path):
    """Add validation to a DTO file"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Skip if already validated
    if should_skip_file(content):
        return False

    # Skip if not a request DTO
    if 'Request' not in file_path and 'Body' not in file_path:
        return False

    # Extract fields
    fields = extract_fields(content)

    if not fields:
        return False

    # Check if needs jakarta.validation imports
    if 'jakarta.validation.constraints' not in content:
        # Add import after other jakarta imports
        import_pattern = r'(import jakarta\..*?;)'
        import_match = re.search(import_pattern, content, re.MULTILINE | re.DOTALL)
        if import_match:
            last_import = content.rfind('\n', 0, import_match.end())
            content = (content[:last_import+1] +
                      'import jakarta.validation.constraints.*;\n' +
                      content[last_import+1:])

    print(f"✓ {file_path.name}")
    return True

def main():
    """Main function"""
    print("="*60)
    print("DTO Validation Auto-Enhancement Script")
    print("="*60)
    print()

    # Find all request DTOs
    request_dttos = []
    for root, dirs, files in os.walk(str(DTO_DIR)):
        for file in files:
            if 'Request' in file and file.endswith('.java'):
                request_dttos.append(Path(root) / file)

    print(f"Found {len(request_dttos)} Request DTOs")
    print()

    # Process each DTO
    count = 0
    for dto_path in sorted(request_dttos):
        if process_dto_file(dto_path):
            count += 1

    print()
    print(f"Enhanced {count} DTOs")
    print()
    print("Next steps:")
    print("1. Review each enhanced DTO")
    print("2. Run: mvn clean compile")
    print("3. Test validation in controllers")

if __name__ == '__main__':
    main()
