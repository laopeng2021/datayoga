> WETZEL_WARNING: Only JSON Schema 3 or 4 is supported. Treating as Schema 3.

# Objects
* [`Job`](#reference-job) (root object)
* [`Step`](#reference-step)


---------------------------------------
<a name="reference-job"></a>
## Job

representation of an ETL job

**`Job` Properties**

|   |Type|Description|Required|
|---|---|---|---|
|**id**|`string`|unique identifier for this job|No|
|**description**|`string`|Description of the job|No, default: |
|**created_at**|`string`|date created|No|
|**updated_at**|`string`|Date updated|No|
|**steps**|`step` `[]`|List of steps. These will be run in order, where each step's output is the next step's input, unless the 'inputs' clause is specified|No, default: `[]`|

Additional properties are allowed.

### Job.id

unique identifier for this job

* **Type**: `string`
* **Required**: No
* **Examples**:
   * `"my_job"`

### Job.description

Description of the job

* **Type**: `string`
* **Required**: No, default: 
* **Examples**:
   * `"this job loads employees"`

### Job.created_at

date created

* **Type**: `string`
* **Required**: No
* **Format**: date-time
* **Examples**:
   * `"2021-06-10T10:01:59.475Z"`

### Job.updated_at

Date updated

* **Type**: `string`
* **Required**: No
* **Format**: date-time
* **Examples**:
   * `"2021-06-10T10:01:59.475Z"`

### Job.steps

List of steps. These will be run in order, where each step's output is the next step's input, unless the 'inputs' clause is specified

* **Type**: `step` `[]`
* **Required**: No, default: `[]`
* **Examples**:
   * `[object Object],[object Object]`




---------------------------------------
<a name="reference-step"></a>
## Step

a step executes a block of a certain type

**`Step` Properties**

|   |Type|Description|Required|
|---|---|---|---|
|**id**|`string`|optional identifier. can be used to reference from another step|No|
|**type**|`string`|type of block to run|No|
|**properties**|`object`|An explanation about the purpose of this instance.| &#10003; Yes|
|**inputs**|`object`|optionally map an input of this block from a named reference of another block's port. use the format of <id>/<output_port>| &#10003; Yes|

Additional properties are allowed.

### step.id

optional identifier. can be used to reference from another step

* **Type**: `string`
* **Required**: No
* **Examples**:
   * `"extract_employee"`

### step.type

type of block to run

* **Type**: `string`
* **Required**: No
* **Examples**:
   * `"extract"`

### step.properties

An explanation about the purpose of this instance.

* **Type**: `object`
* **Required**:  &#10003; Yes
* **Examples**:
   * `[object Object]`

### step.inputs

optionally map an input of this block from a named reference of another block's port. use the format of <id>/<output_port>

* **Type**: `object`
* **Required**:  &#10003; Yes
* **Examples**:
   * `[object Object]`


