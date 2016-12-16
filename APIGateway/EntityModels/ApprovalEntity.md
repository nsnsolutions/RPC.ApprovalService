# ApprovalEntity

The approval entity is the representation for a single approval record. It
contains a few details from the job record, such as type and author, but mostly
tracks the state of the approval process.

## Fields:

| Field Name   | Field Type | Default Value | Description                                                                                        |
| ------------ | ---------- | ------------- | -------------------------------------------------------------------------------------------------- |
| disposition  | STRING     | "pending"     | The approval state of a record. One of: "pending", "approved", "declined"                          |
| type         | STRING     | _REQUIRED_    | The type of _job_ that requested the approval action. One of: "email", "print", "pdf"              |
| jobId        | STRING     | _REQUIRED_    | The jobId associated with this approval request.                                                   |
| jobUniqueId  | STRING     | NULL          | The unique Id given by the requesting party. This value is used by the client, not the VFS System. |
| title        | STRING     | _REQUIRED_    | The title of the product associated with the job.                                                  |
| price        | FLOAT      | _REQUIRED_    | The cost of a single instance of the job if it is fulfilled.                                       |
| quantity     | INT        | 0             | The count of output peices requested by this job.                                                  |
| author       | _PERSON_   | _REQUIRED_    | The person that authored the piece being approved.                                                 |
| completedBy  | _PERSON_   | NULL          | The person that approved or declined the job and closed the approval request.                      |
| comments     | STRING     | _REQUIRED_    | Comments made by the completer at the time that the disposition was set.                           |
| requestDate  | ISO8601    | _REQUIRED_    | The date the job was submitted for approval.                                                       |
| completeDate | ISO8601    | NULL          | The date the completer finalized the disposition of the approval request.                          |


## Example JSON

### Example 1

This is an example of a newly created record that has not yet been approved or
declined.

```json
{
    "disposition": "pending",
    "type": "email",
    "jobId": "VE20161216abcdefg",
    "jobUniqueId": "xxxxABCD123xxxxx",
    "title": "An Example",
    "price": 0,
    "quantity": 1,
    "author": {
        "email": "ilaird@velma.com",
        "fullName": "Ian Laird"
    },
    "requestDate": "2016-12-16T09:43:46.000Z"
}
```

### Example 2

This is an example of a completed record that has been declined.

```json
{
    "disposition": "declined",
    "type": "email",
    "jobId": "VE20161216abcdefg",
    "jobUniqueId": "xxxxABCD123xxxxx",
    "title": "An Example",
    "price": 0,
    "quantity": 1,
    "author": {
        "email": "ilaird@velma.com",
        "fullName": "Ian Laird"
    },
    "completedBy": {
        "email": "johnpublic@velma.com",
        "fullName": "John Public"
    },
    "comments": "comments about why the job is decilned."
    "requestDate": "2016-12-16T09:43:46.000Z"
    "completeDate": "2016-12-16T10:20:41.000Z",
}
```

### Example 3

This is an example of a completed record that has been approved.

```json
{
    "disposition": "approved",
    "type": "email",
    "jobId": "VE20161216abcdefg",
    "jobUniqueId": "xxxxABCD123xxxxx",
    "title": "An Example",
    "price": 0,
    "quantity": 1,
    "author": {
        "email": "ilaird@velma.com",
        "fullName": "Ian Laird"
    },
    "completedBy": {
        "email": "johnpublic@velma.com",
        "fullName": "John Public"
    },
    "requestDate": "2016-12-16T09:43:46.000Z"
    "completeDate": "2016-12-16T10:20:41.000Z",
}
```
