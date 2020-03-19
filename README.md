# db-terminal

Write the same javascript code to execute CRUD operations on various regular and NoSQL databases. The module
currently supports PostgreSQL, MySQL and MongoDB. But, there is an intention to include more databases.

To see a highlight of what can be achieved with this module, let us try to select all students who are named
<code>John</code> from <code>students</code> table. For this, we write the following statements. 

	PostgreSQL and MySQL:	select * from students where name='John';
		
	MongoDB:              db.students.find({ name: "John" })

To perform the same activity on any of the databases via this module, we use the following code:

```
			db.select({
				"table": "students",
				"where": "name='John'"
			});
```

# Installation

Using npm

```	$ npm install db-terminal --save```

Using yarn

```	$ yarn add db-terminal```

# Usage
To use this module, follow the procedures below:

1. Import:
	```const terminal = require('db-terminal');```
2. Instantiate the desired database:

	```
		const name = "postgresql"; // or "mysql" for MySQL, "mongodb" for MongoDB database
		const db = terminal(name);  
	```
	
3. Call the available functions
	The following functions can be called on the <code>db</code> instance created above. Calling any of
	these functions except the <code>connect</code> function is optional.

	+ connect (required)
	+ create
	+ insert
	+ select
	+ update
	+ delete
	+ query
	+ close (recommended)

	In addition to the above functions, the <code>db</code> instance has also the following property.
	
	+ commands

The description of the above functions and <code>command</code> property is given below. Although <code>collection</code> is the appropriate 
term which describes a collection of data in NoSQL databases, the term <code>table</code> will be used
for both of them. The properties of the arguments for each function are also explained where parameters 
within square brackets are optional. In addition, all the callback functions are called according to Node.js
standard where <code>err</code> is passed as the first argument and response data, if any, is passed as 
the second argument.

#### &#x1F537; connect(config :object [, callback :function]): 

This function is used to create a connection with the preferred database. 

<details>
	<summary>config parameters</summary>

Property | Type | Description
------ | ----- |  ---------
[host] | string | The ip address of the machine hosting the database. If not given, its value with be set to <code>localhost</code>.
port | number | The port number which the database server listens to.
user | string | The user name to which the database is associated.
password | string | A password to authenticate the user.
database | string | The name of the database which the user wants to operate on.
[keepAlive] | number | The number of milliseconds to keep the database active without a timeout. If not given, its value will be set to <code>10000</code>.

</details>

Example

```
			const config = {
				"host": "localhost",
				"port": 5432,
				"user": "postgres",
				"password": "abc123",
				"database": "postgres"  
			};

			db.connect(config, (err, res) => {
				if (err) {
					console.log("Error occured.");
					return;
				}
				console.log("Connection successful.");
			});
```


#### &#x1F537; create(params :object [, callback :function]): 

This function is used to create a database or a table.

<details>
  <summary>params</summary>
	<details>
		<summary>database</summary>
		
Property | Type | Description
------ | ----- |  ----------	
database * | string | The name of the database to be created. If a table is desired to be created, this property should be omitted.
[owner] * | string | The name of the owner who will be authorized to use the database.
[template] * | string | The name of a predefined template which will be cloned to create the current database.
[encoding] * | string | The charset encoding to be used within the database.
[tablespace] * | string | The name of the tablespace that will be associated with the new database.
[connlimit] * | number | The maximum number of connections that can simultaneously access the database.	

 ``* - feature not supported in MongoDB``
</details>
	<details>
		<summary>table</summary>
	
Property | Type | Description
------ | ----- |  ----------		
table | string | The name of the table to be created. To create a table, make sure that	the <code>database</code> property is not specified in the <code>params</code> argument.
fields | array | The fields (column names) to be included in the table.
dataTypes | array | The data type of the table fields. Their order should correspond to the order of the <code>fields</code> property defined above. In MongoDB, this property is optional.
[constraints] | array | The constraints for the table fields. Their order should correspond to the order of the <code>fields</code> property defined above. If a field doesn't have a constraint, put its corresponding value to be <code>null</code>.
[defaults] * | array | Default values for the table fields. Their order should correspond to the order of the <code>fields</code> property defined above. If a field doesn't have a default value, put its corresponding value to be <code>null</code>.
[primaryKey] * | array | An array of primary key field names.
[foreignKey] * | array | An array of foreign key field names.
[unique] * | array | An array of field names which should have a unique value.
[inherits] * | array | An array table names from which the table will derive its properties.
[unlogged] * | boolean | Set this property to true to specify that the table is created as an unlogged table where data written to unlogged tables is not written to the write-ahead log but database operations will be faster.
[temporary] * | boolean | Set this value to <code>true</code> to specify that the table which will be created is temporary and will be deleted at the end of the current session or the current transaction based on the <code>onCommit</code> property below.
[onCommit] * | "PRESERVE ROWS", "DELETE ROWS", "DROP" | Specify this property to control the behavior of temporary tables at the end of a transaction block.
[tablespace] * | string | The table space to which the table belongs to.​	

 ``* - feature not supported in MongoDB``
</details>
</details>

Example (database creation)

```
			const params = {
				"database": "mydb",
				"connlimit": 100,
			};

			db.create(params, (err, res) => {
				if (err) {
					console.log("Error occured.");
					return;
				}
				console.log("Database created.");
			});
```

Example (table creation)

```
			const params = {
				"table": "customers",
				"fields": ["id", "name", "email", "address"],
				"dataTypes": ["int", "varchar", "varchar", "text"],
					// 'address' field doesn't have constraint
				"constraints": ["NOT NULL", "NOT NULL", "NOT NULL", null],  
				"primaryKey": ["id"]
			};

			db.create(params, (err, res) => {
				if (err) {
					console.log("Error occured.");
					return;
				}
				console.log("Table created.");
			});
```

#### &#x1F537; insert(params :object [, callback :function]): 

This function is used to insert a row(s) or a column(s) into a table. 

<details>
	<summary>params</summary>
<details>
		<summary>row</summary>
	
Property | Type | Description
------ | ----- |  ----------
table | string | The name of the table to insert a data into.
item | "row", "column" | The type of entity to be inserted. Use <code>row</code> to insert a row and column</code> to insert a column.
fields | array | The names of the fields (column names) for which the data will be inserted.
values | array | The values to be inserted. The order of the elements should correspond to the order of the <code>fields</code> property described above.
[multirow] | boolean | Set the value to <code>true</code> to enable multiple row insertion with a single query statement. If the value is set to <code>true</code>, the <code>values</code> property should be a 2D array where each internal array represents an array of values for a single row.
[sourceTable] | string | Use this property if the data to be inserted is fetched from another table. This property should be the name of the source table.
[sourceFields] | array | The fields in the <code>sourceTable</code> from which the data will be	fetched. If the value is not specified, the array given as <code>fields</code> property will be used instead. If a selector has to be used during fetching, the selector applies only to the first element of this property.
[where] | string | A selector which is used to filter all rows in the <code>sourceTable</code> where the values of the first element of <code>sourceFields</code> pass a comparison given by this property.
[like] | string | A selector which is used to filter all rows in the <code>sourceTable</code> where the values of the first element of <code>sourceFields</code> fulfil a certain regular expression specified by this property.
[between] | array | An array of two elements ([<code>minval</code>, <code>maxval</code>]) which is used to select all rows from <code>sourceTable</code> where the values of the first element of <code>sourceFields</code> are between minval</code> and <code>maxval</code>.
[in] | array | An array of pre-defined values which is used to select all rows from <code>sourceTable</code> where the value of the first element of <code>sourceFields</code> is among those pre-defined values.

</details>
<details>
		<summary>column</summary>

Property | Type | Description
------ | ----- |  ----------	
table | string | The name of the table to insert a data into.
item | "row", "column" | The type of entity to be inserted. Use <code>row</code> to insert a row and column</code> to insert a column.
fields | array | The names of the fields (column names) for which the data will be inserted.
dataTypes * | array | An array of data type(s) of the the field(s) (columns) to be inserted. The order of the elements should correspond to the order of the <code>fields</code> property described above.
[defaults] | array | An array of default values of the the field(s) (columns) to be inserted. The order of the elements should correspond to the order of the <code>fields</code> property described above.
[constraints] * | array | An array of string constraints of the the field(s) (columns) to be inserted. The order of the elements should correspond to the order of the <code>fields</code> property described above. If a field doesn't have a constraint, put its corresponding value in this property to be <code>null</code>.	​	

 ``* - feature not supported in MongoDB``
</details>
</details>

Example (row insertion)

```
			const params = {
				"table": "students",
				"item": "row",
				"fields": ["id", "name", "email"],
				"values": [1, "John Doe", "johndoe@provider.com"]
			};

			db.insert(params, (err, res) => {
				if (err) {
					console.log("Error occured.");
					return;
				}
				console.log("Row inserted.");
			});
```

Example (column insertion)

```
			const params = {
				"table": "customers",
				"item": "column",
				"fields": ["account no."],
				"dataTypes": ["int"],
				"constraints": ["UNIQUE"],  
			};

			db.insert(params, (err, res) => {
				if (err) {
					console.log("Error occured.");
					return;
				}
				console.log("Column inserted.");
			});
```

#### &#x1F537; select(params :object , callback :function): 

This function is used to fetch records from a database. 

<details>
	<summary>params</summary>

Property | Type | Description
------ | ----- |  ----------
table | string | The name of the table to fetch a data from.	
[fields] | array | The names of the fields (column names) for which the data will be fetched. If not given, data will be brought from all fields.	
[distinct] | boolean | Set the value of this property to <code>true</code> to fetch only records which have distinct values.
[count] | string | A field name to determine the number of records in that particular field (column).
[avg] | string | A field name to determine the average of the values in that particular field (column).
[max] | string | A field name to determine the maximum value in that particular field (column).
[min] | string | A field name to determine the minimum value in that particular field (column).
[sum] | string | A field name to determine the sum of the values in that particular field (column).
[where] | string | A selector statement to filter the data to be fetched.
[like] | string | A selector which is used to filter all rows where the values of the first element of <code>fields</code> fulfil a certain regular expression specified by this property. For MongoDB, avoid inclding regex symbols in the string.
[between] | array | An array of two elements ([<code>minval</code>, <code>maxval</code>]) which is used to select all rows where the values of the first element of <code>fields</code> are between <code>minval</code>	and <code>maxval</code>.
[in] | array | An array of pre-defined values which is used to select all rows where the values of the first element of <code>fields</code> are among those pre-defined values.
[limit] | number | The maximum number of records to fetch.
[offset] | string | The number or rows to skip during fetching the results.
[innerJoin] * | string | A table name to make inner join with the table given by <code>table</code> property.
[leftJoin] | string | A table name to make left join with the table given by <code>table</code> property.
[fullOuterJoin] | string | A table name to make full outer join with the table given by <code>table</code> property.
[crossJoin] * | string | A table name to make cross join with the table given by <code>table</code> property.
[naturalJoin] * | string | A table name to make natural join with the table given by <code>table</code> property.
[on] | string | A criteria which specifies on what condition that two tables are joined.
[orderBy] | string | A field name to be used to order the records fetched from the database.	
[order] | "ASC", "DESC" | A propery which describes how the data is ordered while using the <code>orderBy</code> property. Use <code>ASC</code> for an ascending order and <code>DESC</code> for a descending order.
[groupBy] | string | A property which specifies based on which <code>field</code> that the results of aggregate operations will be categorized.
[union] * | string | A table name to fetch a data from in combination with the records from the table given bytable</code> property. Note that all the data in the table given by this property will be used for the union.	
[except] * | string | A table name with records which must be excluded while fetching records from the table given by <code>table</code> property. Note that all the data in the table given by this property will be used for the exclusion.
[intersect] * | string | A table name with records in which only records contained in this table will be fetched from the table given by <code>table</code> property. Note that all the data in the table given by this property will be used for the intersection.
[having] | string | A criteria which filters results grouped by the <code>groupBy</code> property.

 ``* - feature not supported in MongoDB``
</details>

Example

```
			const params = {
				"table": "items",
				"fields": ["id", "price", "quantity"],
				"where": "price < 100.0",
				"orderBy": "quantity",
				"order": "ASC"
			};

			db.select(params, (err, res) => {
				if (err) {
					console.log("Error occured.");
					return;
				}
				console.log(res);
			});
```

#### &#x1F537; update(params :object [, callback :function]): 

This function is used to update existing records in a database. 

<details>
	<summary>params</summary>

Property | Type | Description
------ | ----- |  ----------
table | string | The name of the table to update.	
fields | array | The names of the fields (column names) for which the data will be updated.	
values | array | The new values of the <code>fields</code> to update the table with. Their order should correspond to the order of the field names given in the <code>field</code> property described above.
[from] | string | The name of a source table from which the data which is used to update <code>table</code> is obtained.
[sourceFields] | array | The field names of the source table which correspond with <code>fields</code> for the update. If this property is not specified, the columns given by <code>fields</code> will be used as a substitute. In MongoDB, this field has no effect and the <code>fields</code> in the <code>table</code> and <code>sourceTable</code> should match.
where | string | A condition which specifies which rows should be updated.

</details>

Example

```
			const params = {
				"table": "employees",
				"fields": ["salary"],
				"values": [2000],
				"where": "department = 'frontend'",
			};

			db.update(params, (err, res) => {
				if (err) {
					console.log("Error occured.");
					return;
				}
				console.log(res);
			});
```

#### &#x1F537; delete(params :object [, callback :function]): 

This function is used to delete databases, tables, columns or rows. 

<details>
	<summary>params</summary>
	<details>
		<summary>database</summary>

Property | Type | Description
------ | ----- |  ----------
database | string | The name of the database to delete. No error will be thrown if the database	doesn't exist.
item | "database" | A property which describes the entity to delete.

</details>
	<details>
		<summary>table</summary>

Property | Type | Description
------ | ----- |  ----------
table | string | The name of the table to delete or truncate.
item | "table" | A property which describes the entity to delete.
[truncate] | boolean | Set the value to <code>true</code> to truncate the table instead of deleting it.
	
</details>
<details>
		<summary>column</summary>

Property | Type | Description
------ | ----- |  ----------
table | string | The table name to delete a column(s) from.
item | "column" | A property which describes the entity to delete.
fields | array | The field name(s) (column name(s)) to be deleted. An error will be thrown if the column doesn't exist.
	
</details>
<details>
		<summary>row</summary>

Property | Type | Description
------ | ----- |  ----------
table | string | The table name to delete a row(s) from.
item | "row" | A property which describes the entity to delete.
fields | array | The field name(s) to be used to select the rows which will be deleted.
[using] * | string | The name of a reference table which is referenced with <code>where</code> condition and used to delete selected rows in <code>table</code>.
[where] | string | A selector which is used to delete all rows which pass a comparison stated by this property.
[like] | string | A selector which is used to delete all rows in which the values of the first element of <code>fields</code> fulfil a certain regular expression specified by this property.
[between] | array | An array of two elements ([<code>minval</code>, <code>maxval</code>]) which is used	to delete all rows where the values of the first element of <code>fields</code> are between <code>minval</code>	and <code>maxval</code>.
[in] | array | An array of pre-defined values which is used to delete all rows where the values of the first element of <code>fields</code> are among those pre-defined values.	

 ``* - feature not supported in MongoDB``
</details>
</details>

Example (database deletion)

```
			db.delete({"database": "items", item: "database"}, (err, res) => {
				if (err) {
					console.log("Error occured.");
					return;
				}
				console.log("Database deleted");
			});
```

Example (table truncation)

```
			const params = {
				"table": "customers",
				"item": "table",
				"truncate": true
			};

			db.delete(params, (err, res) => {
				if (err) {
					console.log("Error occured.");
					return;
				}
				console.log("Table truncated");
			});
```

Example (column deletion)

```
			const params = {
				"table": "items",
				"item": "column",
				"fields": ["price"]
			};

			db.delete(params, (err, res) => {
				if (err) {
					console.log("Error occured.");
					return;
				}
				console.log("Column 'price' deleted");
			});
```

Example (row deletion)

```
			const params = {
				"table": "users",
				"item": "row",
				"fields": ["date"],
				"in": ["02/15/2020", "02/16/2020"]
			};

			db.delete(params, (err, res) => {
				if (err) {
					console.log("Error occured.");
					return;
				}
				console.log("Rows deleted");
			});
```

#### &#x1F537; query(document :string |  |  object [, callback :function]): 

<p style="text-align: justify;">The advantage of the above functions is that they are database independent. You will use the same javascript code inspite of 
the database (PostgreSQL, MongoDB, ...) you use. However, they do not cover all possible database querries. However, there is still a back door offered by this module to execute any database query via this function. But, these querries are database specific.
And the developer should take this into consideration while using this function. The <code>document</code> argument is the database specific SQL statement (string) for regular databases or a query document (object) for noSQL databases.

<p style="text-align: justify;">In MongoDB, the <code>document</code> object should be constructed according to database commands stated in 
<a href="https://docs.mongodb.com/manual/reference/command/">this</a> official documentation. Apart from these specifications,
each document may also include additional <code>$db</code> key with a corresponding value of the name of the
database on which the database operations will be performed. If this property is not included, the database name specified
in the <code>config</code> parameter passed to the <code>connect</code> function will be used. See an example below.</p>

Example (PostgreSQL and MySQL)

```
			const sql = "select id from students except select ineligible_ids from programming";
			db.query(sql, (err, res) => {
				if (err) {
					console.log("Error occured.");
					return;
				}
				console.log(res);
			});
```

Example (MongoDB)
```
			const doc = { 
				find: "items", 
				$db: "sales", 
				projection: { _id: 0, price: 1, quantity: 1 }, 
				sort: { price: -1} 
			};

			db.query(doc, (err, res) => {
				if (err) {
					console.log("Error occured.");
					return;
				}
				console.log(res);
			});
```

#### &#x1F537; close(): 

<p style="text-align: justify;">This function closes the database connection.</p>

Example (MySQL or PostgreSQL)

```
			db.query("select * from customers", (err, res) => {
				if (err) {
					console.log("Error occured.");
					return;
				}
				console.log(res);
				db.close();
			});
```

#### &#x1F537; commands: 

<p style="text-align: justify;">This property contains the list of all commands (or status) of the executed operations. Each
element in the array contains an object with two properties - one for SQL and another for its NoSQL equivalent or vice versa.</p>

Example

```
			db.commands.forEach((command) => {
				console.log(command); // logs each command
			});	
```
 A sample <code>command</code> output for the above code may look like:

 ```
			{ sql:
			  	'UPDATE customers SET email = 'abc@def.com' , name = 'John Doe' WHERE id = 213',
			  nosql:
			    { 
			    	update: 'customers',
			      '$db': 'mydb',
			      ordered: false,
			      updates: [{ 
			        q: { id: 213 },  
			        u: { '$set': { email: 'abc@def.com', name: 'John Doe' } },
							upsert: true,
							multi: true 
						}] 
			   	} 
			 }
 ```

## Issues or suggestions?
If you have any issues or if you want to suggest something, you can write it [here](https://github.com/Asaye/db-terminal/issues).
