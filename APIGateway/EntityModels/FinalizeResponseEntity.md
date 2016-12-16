# FinalizeResponseEntity

Represents the response to a FinalizeRequest.

## Fields:

| Field Name   | Field Type | Default Value | Description                                                                                                       |
| ------------ | ---------- | ------------- | ----------------------------------------------------------------------------------------------------------------- |
| hasError     | BOOLEAN    | _REQUIRED_    | A flag indicating if any of the items failed to get set.                                                          |
| items | _FinalizeResponseItemEntity_[] | _REQUIRED_ | A list of FinalizeResponseItemEntity items that give details about the individual result for each item. |

## Example JSON

### Example 1

Result set with 3 items where 1 failured.

```json
{
    "hasError": true,
    "items": [
        { "jobId": "VE20161216abcdefg", "success": true, "message": "Completed successfully" },
        { "jobId": "VE20161216abcdefh", "success": true, "message": "Completed successfully" },
        { "jobId": "VE20161216abcdefi", "success": false, "message": "Details about failure." }
    ]
}
```

### Example 2

Result set with 3 items where 0 failured.

```json
{
    "hasError": false,
    "items": [
        { "jobId": "VE20161216abcdefg", "success": true, "message": "Completed successfully" },
        { "jobId": "VE20161216abcdefh", "success": true, "message": "Completed successfully" },
        { "jobId": "VE20161216abcdefi", "success": true, "message": "Completed successfully" }
    ]
}
```

### Example 3

Result set with 3 items where all failed

```json
{
    "hasError": true,
    "items": [
        { "jobId": "VE20161216abcdefg", "success": false, "message": "Details about failure." },
        { "jobId": "VE20161216abcdefh", "success": false, "message": "Details about failure." },
        { "jobId": "VE20161216abcdefi", "success": false, "message": "Details about failure." }
    ]
}
```
