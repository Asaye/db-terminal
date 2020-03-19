module.exports = {
	"DATA_NOT_GIVEN": "Error: request data not provided.",
	"DATA_NOT_STRING": "Error: request data type should be a string.",
	"DATA_NOT_OBJECT": "Error: request data type should be an object.",
	"TABLE_NOT_GIVEN": "Error: request data missing required 'table' property.",
	"PROP_NOT_GIVEN": (p) => `Error: request data missing required '${p}' property.`,
	"PROP_NOT_ARRAY": (p) => `Error: provided '${p}' property is not an array.`,
	"PROP_NOT_NUMBER": (p) => `Error: provided '${p}' property is not a number.`,
	"ARRAY_EMPTY": (p) => `Error: provided '${p}' property is an empty array.`,
	"ARRAY_INCOMPLETE": (p) => `Error: provided '${p}' property contains fewer number of elements than required.`,
};