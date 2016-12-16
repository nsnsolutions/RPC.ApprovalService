# FinalizeRequestItemEntity.md

Used to set the disposition of a __single__ job approval request. This will be
a POST body sent by the client to a specific job route.

## Fields:

| Field Name   | Field Type | Default Value | Description                                                                                        |
| ------------ | ---------- | ------------- | -------------------------------------------------------------------------------------------------- |
| disposition  | STRING     | _REQUIRED_    | The approval state to set on the a record. One of: "approved", "declined"                          |
| comments     | STRING     | null          | The comments to record on the record that describe the reason of the selected disposition.         |


## Example JSON

### Example 1

Decline an approval request with comments.

```json
{
    "disposition": "declined",
    "comments": "comments about why the job is decilned."
}
```

### Example 2

Approve an approval request without comments.

```json
{
    "disposition": "approved"
}
```

_Note: comments is not required but can be set regardless of the selected
disposition._
