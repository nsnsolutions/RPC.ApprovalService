# FinalizeRequestEntity

Represents the current state of the work for the current client.

## Fields:

| Field Name   | Field Type | Default Value | Description                                                                                     |
| ------------ | ---------- | ------------- | ----------------------------------------------------------------------------------------------- |
| jobIds       | STRING[]   | _REQUIRED_    | A list of jobIds on which to set the given disposition.                                         |
| disposition  | STRING     | _REQUIRED_    | The approval state to set on each record. One of: "approved", "declined"                        |
| comments     | STRING     | null          | The comments to record on each record that describes the reason of the selected disposition.    |


## Example JSON

### Example 1

A request to approve 2 jobs with a comment.

```json
{
    "jobIds": [ "VE20161216abcdefg", "VE20161216abcdefh" ],
    "disposition": "approved",
    "comments": "An example comment."
}
```

### Example 1

A request to decline 1 jobs without a comment.

```json
{
    "jobIds": [ "VE20161216abcdefg" ],
    "disposition": "declined"
}
```

_Note: comments is not required but can be set regardless of the selected
disposition._
