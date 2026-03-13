"""
API Structure Test - Verify endpoints are properly defined
"""
import sys
sys.path.insert(0, 'backend')

from main import app

print("Testing API structure...\n")

# Check OpenAPI schema for relationship endpoints
print("✓ Checking OpenAPI schema...")
openapi = app.openapi()
paths = openapi.get("paths", {})

expected_endpoints = [
    ("/api/relationships/help", "POST"),
    ("/api/relationships/thanks", "POST"),
    ("/api/relationships/{person_a_id}/{person_b_id}/trust", "GET"),
    ("/api/relationships/{person_a_id}/{person_b_id}/history", "GET"),
    ("/health", "GET"),
    ("/api/discover", "POST")
]

print("\nEndpoints found:")
for endpoint, method in expected_endpoints:
    if endpoint in paths and method.lower() in paths[endpoint]:
        print(f"  ✓ {method:6} {endpoint}")
    else:
        print(f"  ✗ {method:6} {endpoint} - NOT FOUND")

print("\n✅ API structure verification complete!")
print(f"\nTotal endpoints: {len(paths)}")
