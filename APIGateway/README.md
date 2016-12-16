# API Gateway

Defines the routes for the approvals API as it applies to the VFS Jobs API. 

## GET /jobs/approvals/

Returns the counts of jobs in different dispositions under the client's
account.

__Request Headers:__

- Authorization: JWT Token that defines a _PERSON_ at the minium.

__Returns:__ _ApprovalStatsEntity_


## GET /jobs/approvals/pending

Retrieve the a set of pending approval requests that matche the optional
filter criteria.

__Request Headers:__

- Authorization (Header): JWT Token that defines a _PERSON_ at the minium.

__QueryString Parameters:__

- startDate: ISO8601 String. When provided, limits data to only requests __created__ after this date.
- endDate: ISO8601 String. When provided, limits data to only requests __create__ before this date.
- pageSize: Integer. Set the number of items in 1 page of data.
- pageIndex: Integer. Select the page number to return. Zero based list. The first page is index zero.
- sortBy: String. The name of a field defined in _ApprovalEntity_ model used to sort the items array.
- sortDir: String. A value indicating the sort direction. One of: "ascending", "descending"
- filterBy: Filter String (see below). Defines additional limiting filters to apply to the query.

__Returns:__ _ApprovalListEntity_

## POST /jobs/approvals/pending

Set the disposition on one or more approval requests.

__Request Headers:__

- Authorization: JWT Token that defines a _PERSON_ at the minium.

__Body:__ _FinalizeRequestEntity_

__Returns:__ _FinalizeResponseEntity_

## GET /jobs/approvals/completed

Retrieve the set of completed approval requests that matche the optional filter
criteria.

__Request Headers:__

- Authorization: JWT Token that defines a _PERSON_ at the minium.

__QueryString Parameters:__

- startDate: ISO8601 String. When provided, limits data to only requests __completed__ after this date.
- endDate: ISO8601 String. When provided, limits data to only requests __completed__ before this date.
- pageSize: Integer. Set the number of items in 1 page of data.
- pageIndex: Integer. Select the page number to return. Zero based list. The first page is index zero.
- sortBy: String. The name of a field defined in _ApprovalEntity_ model used to sort the items array.
- sortDir: String. A value indicating the sort direction. One of: "ascending", "descending"
- filterBy: Filter String (see below). Defines additional limiting filters to apply to the query.

__Returns:__ _ApprovalListEntity_

## GET /jobs/{jobId}/approval/

Retrieve a single approval record for the given jobId.

__Request Headers:__

- Authorization: JWT Token that defines a _PERSON_ at the minium.

__Returns:__ _ApprovalEntity_

## POST /jobs/{jobId}/approval/

Set the approval disposition on a specific job record.

__Request Headers:__

- Authorization: JWT Token that defines a _PERSON_ at the minium.

__Body:__ _FinalizeRequestItemEntity_

__Returns:__ _FinalizeReponseItemEntity_

# FilterBy

Some urls accept filter information in a querystring named __filterBy__.  These
filters can be applied to multiple fields at the same time using various
operations.

This section describes the filterby structure.

## FilterBy Structure

The basic structure for a filterBy string is

```
FIELD:OPERATOR:VALUES
```

Multiple filters can be placed into the query string separated by a semicolon
(`;`).

```
FIELD1:OPERATOR1:VALUES1;FIELD2:OPERATOR2:VALUES2
```

For operators that supports multiple values, such as a `IN` operation, use a comma (`,`) between each relevant value.

```
FIELD:OPERATOR:VALUE1,VALUE2,VALUE3
```

## FilterBy Operators

The system currently supports 3 operations:

- EQ: A Equality operation.  The value in FIELD is equal to VALUE.
- IN: A list comparison operation. The value in FIELD is one of the VALUES.
- CONTAINS: A fuzy search comparison operation. The value in FIELD contains at least VALUE.

## FilterBy Examples

### Example 1

Filter result set to items of type '_email_'.

```
?filterBy=type:EQ:email
```

### Example 2

Filter result set to items of type '_email_' with a disposition of either
'_pending_' or '_approved_'

```
?filterBy=type:EQ:email;disposition:IN:pending,approved
```

### Exmaple 3

Filter result set to items of type '_email_', with a disposition of either
'_pending_' or '_approved_', and contains the word '_specials_' in the title.


```
?filterBy=type:EQ:email;disposition:IN:pending,approved;title:CONTAINS:specials
```

### Example 4

Filter results for approver by email.

```
?filterBy=completedBy.email:EQ:john.public@velma.com
```
