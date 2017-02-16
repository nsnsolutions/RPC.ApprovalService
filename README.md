# RPC.ApprovalService

Raise events on SNS Bus.

## Quick Start

To run the service locally:

```bash
npm install
npm start -- --debug
```

For automatic code reloading in development:

```bash
npm install -g nodemon
nodemon -- --debug
```

To run on __AMQP__, omit the ```--debug``` option from either command.

<sup>_Note: You will need a running [RabbitMQ and ETCD2](https://github.com/nsnsolutions/rpcfw.env) environment._</sup>

# Interface

This section outlines the details you will need to use this service.

- [Methods](#methods)
- [Representations](#representations)

## Methods

- [Finalize Approval Request (v1)](#finalize-approval-request-v1) - Approve or decline an approval request and begin processing job.
- [Create Approval Record (v1)](#create-approval-record-v1) - Create a new approval record for an existing job.
- [Fetch Approval Record (v1)](#fetch-approval-record-v1) - Retrieve the details about a specific approval request.
- [List Client Approval Records (v1)](#list-client-approval-records-v1) - Search for a list of approval records filtered by the current client.
- [List Sponsor Approval Records (v1)](#list-sponsor-approval-records-v1) - Search for a list of approval records filtered by the current sponsor.
- [Fetch Client Metrics (v1)](#fetch-client-metrics-v1) - Retrieve the count of approved, declined, and pending requests for the current client.
- [Fetch Sponsor Metrics (v1)](#fetch-sponsor-metrics-v1) - Retrieve the count of approved, declined, and pending requests for the current sponsor.


### Finalize Approval Request (v1)

Approve or decline an approval request and begin processing job.

#### RPC Execution

- Role: approvalService.Pub
- Cmd: finalizeApprovalRequest.v1

```javascript
var args = { ... }
seneca.act('role:approvalService.Pub,cmd:finalizeApprovalRequest.v1', args, (err, dat) => {
    /* Handle result */
});
```

#### HTTP Execution

- Service Name: approvalService
- Method Name: finalizeApprovalRequest
- Version: v1

```
POST /amqp/exec/approvalService/finalizeApprovalRequest?version=v1 HTTP/1.1
Host: devel.rpc.velma.com
Content-Type: application/json
x-repr-format: RPC
Cache-Control: no-cache

{ ... }
```

#### Arguments

This method accepts the following arguments.

| Param     | Type   | Default | Description |
| --------- | ------ | ------- | ----------- |
| token | String | N/A | An authority token providing at least JOB:30 access. |
| jobIds | Array | N/A | A list of jobIds to finalize. |
| disposition | String | N/A | The disposition to set on the finalized jobs. One of: _approved_, _declined_ |
| comments | String | None | Optional: Custom comments from the person that finalized the request(s). |

#### Returns

This method returns the following information.

- [Error Response (v1)](#error-response-v1)
- [Finalize Response Entity (v1)](#finalize-response-entity-v1)

### Create Approval Record (v1)

Create a new approval record for an existing job.

#### RPC Execution

- Role: approvalService.Pub
- Cmd: createApprovalRecord.v1

```javascript
var args = { ... }
seneca.act('role:approvalService.Pub,cmd:createApprovalRecord.v1', args, (err, dat) => {
    /* Handle result */
});
```

#### HTTP Execution

- Service Name: approvalService
- Method Name: createApprovalRecord
- Version: v1

```
POST /amqp/exec/approvalService/createApprovalRecord?version=v1 HTTP/1.1
Host: devel.rpc.velma.com
Content-Type: application/json
x-repr-format: RPC
Cache-Control: no-cache

{ ... }
```

#### Arguments

This method accepts the following arguments.

| Param     | Type   | Default | Description |
| --------- | ------ | ------- | ----------- |
| token | String | N/A | An authority token providing at least JOB:10 access. |
| type | String | N/A | The type of job. eg: _print_, _email_ |
| jobId | String | N/A | The jobId that needs approval. |
| jobUniqueId | String | None | The client job unique identifier associated with the job that needs approval. |
| title | String | None | The product title used by the job that needs approval. |
| price | Number | N/A | The unit cost associated with this job, if approved. |
| quantity | Number | 0 | The number of units that will be sent if approved. |

#### Returns

This method returns the following information.

- [Error Response (v1)](#error-response-v1)
- [Approval Entity (v1)](#approval-entity-v1)

### Fetch Approval Record (v1)

Retrieve the details about a specific approval request.

#### RPC Execution

- Role: approvalService.Pub
- Cmd: fetchApprovalRecord.v1

```javascript
var args = { ... }
seneca.act('role:approvalService.Pub,cmd:fetchApprovalRecord.v1', args, (err, dat) => {
    /* Handle result */
});
```

#### HTTP Execution

- Service Name: approvalService
- Method Name: fetchApprovalRecord
- Version: v1

```
POST /amqp/exec/approvalService/fetchApprovalRecord?version=v1 HTTP/1.1
Host: devel.rpc.velma.com
Content-Type: application/json
x-repr-format: RPC
Cache-Control: no-cache

{ ... }
```

#### Arguments

This method accepts the following arguments.

| Param     | Type   | Default | Description |
| --------- | ------ | ------- | ----------- |
| token | String | N/A | An authority token providing at least JOB:10 access. |
| jobId | String | N/A | The jobId associated with the desired approval request. |

#### Returns

This method returns the following information.

- [Error Response (v1)](#error-response-v1)
- [Approval Entity (v1)](#approval-entity-v1)

### List Client Approval Records (v1)

Search for a list of approval records filtered by the current client.

#### RPC Execution

- Role: approvalService.Pub
- Cmd: listClientApprovalRecords.v1

```javascript
var args = { ... }
seneca.act('role:approvalService.Pub,cmd:listClientApprovalRecords.v1', args, (err, dat) => {
    /* Handle result */
});
```

#### HTTP Execution

- Service Name: approvalService
- Method Name: listClientApprovalRecords
- Version: v1

```
POST /amqp/exec/approvalService/listClientApprovalRecords?version=v1 HTTP/1.1
Host: devel.rpc.velma.com
Content-Type: application/json
x-repr-format: RPC
Cache-Control: no-cache

{ ... }
```

#### Arguments

This method accepts the following arguments.

| Param     | Type   | Default | Description |
| --------- | ------ | ------- | ----------- |
| token | String | N/A | An authority token providing at least JOB:10 access. |
| pageSize | Number | _Total_ | Optional: Set the number of items in 1 page of data. |
| pageIndex | Number | 1 | Optional: The page of data to return. |
| dateField | String | None | Optional: Select the date field (requestDate, completeDate, updateDate) used to apply range filters. |
| startDate | ISO8601 String. | None | Optional: When provided, limits data to only requests created after this date. |
| endDate | ISO8601 String. | None | Optional: When provided, limits data to only requests create before this date. |
| sortBy | String. | _dateField_ or _createDate_ | Optional: The name of a field defined in ApprovalEntity model used to sort the items array. |
| sortDir | String. | ascending | Optional: A value indicating the sort direction. One of: _ascending_, _descending_ |
| filterBy | String | "" | Optional: Defines additional limiting filters to apply to the query.  See [Static Parse Filter](https://github.com/nsnsolutions/RPC.Utils/blob/devel/README.md#staticmethod-parsefilterstring) for more information. |

#### Returns

This method returns the following information.

- [Error Response (v1)](#error-response-v1)
- [Approval List Entity (v1)](#approval-list-entity-v1)

### List Sponsor Approval Records (v1)

Search for a list of approval records filtered by the current sponsor.

#### RPC Execution

- Role: approvalService.Pub
- Cmd: listSponsorApprovalRecords.v1

```javascript
var args = { ... }
seneca.act('role:approvalService.Pub,cmd:listSponsorApprovalRecords.v1', args, (err, dat) => {
    /* Handle result */
});
```

#### HTTP Execution

- Service Name: approvalService
- Method Name: listSponsorApprovalRecords
- Version: v1

```
POST /amqp/exec/approvalService/listSponsorApprovalRecords?version=v1 HTTP/1.1
Host: devel.rpc.velma.com
Content-Type: application/json
x-repr-format: RPC
Cache-Control: no-cache

{ ... }
```

#### Arguments

This method accepts the following arguments.

| Param     | Type   | Default | Description |
| --------- | ------ | ------- | ----------- |
| token | String | N/A | An authority token providing at least JOB:10 access. |
| pageSize | Number | _Total_ | Optional: Set the number of items in 1 page of data. |
| pageIndex | Number | 1 | Optional: The page of data to return. |
| dateField | String | None | Optional: Select the date field (requestDate, completeDate, updateDate) used to apply range filters. |
| startDate | ISO8601 String. | None | Optional: When provided, limits data to only requests created after this date. |
| endDate | ISO8601 String. | None | Optional: When provided, limits data to only requests create before this date. |
| sortBy | String. | _dateField_ or _createDate_ | Optional: The name of a field defined in ApprovalEntity model used to sort the items array. |
| sortDir | String. | ascending | Optional: A value indicating the sort direction. One of: _ascending_, _descending_ |
| filterBy | String | "" | Optional: Defines additional limiting filters to apply to the query.  See [Static Parse Filter](https://github.com/nsnsolutions/RPC.Utils/blob/devel/README.md#staticmethod-parsefilterstring) for more information. |

#### Returns

This method returns the following information.

- [Error Response (v1)](#error-response-v1)
- [Approval List Entity (v1)](#approval-list-entity-v1)

### Fetch Client Metrics (v1)

Retrieve the count of approved, declined, and pending requests for the current client.

#### RPC Execution

- Role: approvalService.Pub
- Cmd: fetchClientMetrics.v1

```javascript
var args = { ... }
seneca.act('role:approvalService.Pub,cmd:fetchClientMetrics.v1', args, (err, dat) => {
    /* Handle result */
});
```

#### HTTP Execution

- Service Name: approvalService
- Method Name: fetchClientMetrics
- Version: v1

```
POST /amqp/exec/approvalService/fetchClientMetrics?version=v1 HTTP/1.1
Host: devel.rpc.velma.com
Content-Type: application/json
x-repr-format: RPC
Cache-Control: no-cache

{ ... }
```

#### Arguments

This method accepts the following arguments.

| Param     | Type   | Default | Description |
| --------- | ------ | ------- | ----------- |
| token | String | N/A | An authority token providing at least JOB:10 access. |

#### Returns

This method returns the following information.

- [Error Response (v1)](#error-response-v1)
- [Approval Stats Entity (v1)](#approval-stats-entity-v1)

### Fetch Sponsor Metrics (v1)

Retrieve the count of approved, declined, and pending requests for the current sponsor.

#### RPC Execution

- Role: approvalService.Pub
- Cmd: fetchSponsorMetrics.v1

```javascript
var args = { ... }
seneca.act('role:approvalService.Pub,cmd:fetchSponsorMetrics.v1', args, (err, dat) => {
    /* Handle result */
});
```

#### HTTP Execution

- Service Name: approvalService
- Method Name: fetchSponsorMetrics
- Version: v1

```
POST /amqp/exec/approvalService/fetchSponsorMetrics?version=v1 HTTP/1.1
Host: devel.rpc.velma.com
Content-Type: application/json
x-repr-format: RPC
Cache-Control: no-cache

{ ... }
```

#### Arguments

This method accepts the following arguments.

| Param     | Type   | Default | Description |
| --------- | ------ | ------- | ----------- |
| token | String | N/A | An authority token providing at least JOB:10 access. |

#### Returns

This method returns the following information.

- [Error Response (v1)](#error-response-v1)
- [Approval Stats Entity (v1)](#approval-stats-entity-v1)


## Representations

All response sent by this service will differ depending on the protocal used
and the control headers set on the request. You can read more about how this
output is create in the [RPC Interface Response Model](https://github.com/nsnsolutions/RPC.Interface#response-object)
documentation.

Excluding [Error Response (v1)](#error-response-v1), this documentation will
only show the result body details.

- [Error Response (v1)](#error-response-v1)
- [Empty (all)] (#empty-all)
- [Approval Entity (v1)] (#approval-entity-v1)
- [Approval List Entity (v1)] (#approval-list-entity-v1)
- [Approval Stats Entity (v1)] (#approval-stats-entity-v1)
- [Finalize Response Entity (v1)] (#finalize-response-entity-v1)
- [Finalize Response Item (v1)] (#finalize-response-item-v1)
- [Person (v1)] (#person-v1)

### Error Response (v1)

Represents an execution failure. Details about the failure are placed in
`message` and a numeric value is placed in `code` that is specific to the type
of error.

This response uses the standard
[rpcfw](https://github.com/nsnsolutions/rpcfw/blob/devel/README.md#errors)
error model and codes.

```json
{
    "hasError": true,
    "code": 000,
    "message": "Description of error"
}
```

For more information on workflow error codes:
[RPC-Utils.Executor](https://github.com/nsnsolutions/RPC.Utils/blob/devel/README.md#executor)

<sup>_Note: This detail level is not always returnes. Please see the [RPC Interface Response Model](https://github.com/nsnsolutions/RPC.Interface#response-object) documentation for more information._</sup>


### Empty (all)

Represents a empty data return.

_Empty Representations_


### Approval Entity (v1)

A complete approval request record containg all information currently known about an approval request.

| Field | Type | Description |
| ----- | ---- | ----------- |
| disposition | String | If set, the finalized disposition (_approved_, _declined_) of this approval request. |
| type | String | The type of job (_print_, _email_, _pdf_) set on the origination job of this approval request. |
| jobId | String | The VFS jobId associated with the origination job of this approval request. |
| jobUniqueId | String | The client job unique identifier associated with the origination job of this approval request. |
| title | String | The product title used by the associated origination job of this approval request. |
| price | Number | The unit cost associated with the origination job of this approval request. |
| quantity | Number | The number of units associated with the origination job of this approval request. |
| author | [Person (v1)](#person-v1) | The person that created the approval request. |
| completedBy | [Person (v1)](#person-v1) | The person that finalized the approval request. |
| requestDate | ISO8601 String | The date and time at which the request was requested. |
| completeDate | ISO8601 String | The date and time at which the request was completed. |
| comments | String | If set, The comments added by the approver/decliner when the request was finalized. |


### Approval List Entity (v1)

The search results of an approval list query operation. This entity contains details about page information, currently known approvers (for filtering) and the current page's result set.

| Field | Type | Description |
| ----- | ---- | ----------- |
| jobIds | String Array | A list of all the jobIds found under the current filters accross all pages. |
| items | [Approval Entity (v1)](#approval--entity-v1) Array | The current page of appoval records that match the provided search criteria. |
| approvers | [Person (v1)](#person-v1) Array. | A list of all approvers known to the system under the current context. |
| totalCount | Number | The total number of items identify in the search accross all pages. |
| pageIndex | Number | The current page number. |
| itemPerPage | Number | The maximum number of items on each page. |


### Approval Stats Entity (v1)

Status counts (_pending_, _approved_, _declined_) for the current context (sponsor, client).

| Field | Type | Description |
| ----- | ---- | ----------- |
| approvedCount | Number | The number of items that have been approved, in context. |
| declinedCount | Number | The number of items that have been declined, in context. |
| pendingCount | Number | The number of items waiting for finalization, in context. |


### Finalize Response Entity (v1)

The results of a Finalize Approval Request operation. This response will contain a status for each job in the finalize request.

| Field | Type | Description |
| ----- | ---- | ----------- |
| hasError | Boolean | A boolean value indicating if any of the items failed to process. |
| items | [Finalize Response Item (v1)](#finalize-response-item-v1) Array | An array of items that indicate the success state of each job in the finalize request. |


### Finalize Response Item (v1)

A entity indicating the success of a single item in a [Finalize Response Entity (v1)](#finalize-response-entity-v1).

| Field | Type | Description |
| ----- | ---- | ----------- |
| jobId | String | The jobId associated with the approval request that was finalized. |
| success | Boolean | A boolean value indicating the success state of this item. |
| message | String | A success message or explination of a processing failure. |


### Person (v1)

A person, author or approver, refrenced by another model.

| Field | Type | Description |
| ----- | ---- | ----------- |
| sponsorId | String | The unique identifier of the sponsor record to which this person belongs. |
| clientId | String | The unique identifier of the client record to which this person belongs. |
| userId | String | The unique identifier of the user as defined by the sponser. |
| email | String | The users email address. |
| fullName | String | The users full name. |



---

<sup>_This documentation was generated by Ian's handy template engine. If you find errors, please let hime know._</sup>