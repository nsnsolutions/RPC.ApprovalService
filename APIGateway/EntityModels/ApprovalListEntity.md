# ApprovalListEntity

The approval list entity is the representation for a set approval records. It
contains a details about paging and a list of __ApprovalEntity__ items.

## Fields:

| Field Name   | Field Type | Default Value | Description                                                                                               |
| ------------ | ---------- | ------------- | --------------------------------------------------------------------------------------------------------- |
| jobIds       | STRING[]   | _REQUIRED_    | A list of all the jobIds contained in the result set including those outside the currently selected page. |
| items   | _ApprovalEntity_[] | _REQUIRED_ | A list of _ApprovalEntity_ items on the currently selected page.                                          |
| totalCount   | INT        | _REQUIRED_    | The total number of approval records for the current result set.                                          |
| pageIndex    | INT        | _REQUIRED_    | The page index currently returned. _Note: Index is a zero based list._                                    |
| itemPerPage  | INT        | _REQUIRED_    | The maximum number of items on each page. The last result set might have less this then number.           |
| approvers    | _PERSON_[] | _REQUIRED_    | A distinct list of available approvers for this client.                                                   |

## Example JSON

### Example 1

The items for the first page of a multi page result set.

```json
{
    "jobIds": [ "VE20161216abcdefg", "VE20161216abcdefh", ... ],
    "items": [ ... ],
    "totalCount": 45,
    "pageIndex": 0,
    "itemPerPage": 10,
    "approvers": [
        { "email": "johnpublic@velma.com", "fullName": "John Public" }
    ]
}
```

### Example 2

The items for the first page of a single page result set.

```json
{
    "jobIds": [ "VE20161216abcdefg", "VE20161216abcdefh" ],
    "items": [ ... ],
    "totalCount": 2,
    "pageIndex": 0,
    "itemPerPage": 10,
    "approvers": [ 
        { "email": "johnpublic@velma.com", "fullName": "John Public" }
    ]
}
```
