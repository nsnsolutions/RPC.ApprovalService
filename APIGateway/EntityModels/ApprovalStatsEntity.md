# ApprovalStatsEntity

Represents the current state of the work for the current client.

## Fields:

| Field Name    | Field Type | Default Value | Description                                                                                     |
| ------------- | ---------- | ------------- | ----------------------------------------------------------------------------------------------- |
| approvedCount | INT        | _REQUIRED_    | Number of items approved for this client since the begining of time.                            |
| declinedCount | INT        | _REQUIRED_    | Number of items declined for this client since the begining of time.                            |
| pendingCount  | INT        | _REQUIRED_    | Number of items that are neither approved or declined for this client at the time of the query. |

## Example JSON

### Example 1

```json
{
    "approvedCount": 121212,
    "declinedCount": 212121,
    "pendingCount": 42
}
```
