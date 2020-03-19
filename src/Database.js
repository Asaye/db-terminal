const net = require('net');
const Defaults = require('./utils/Defaults');
const Reply = require('./responses');

var Database = class {	

	constructor(type) {
		this.type = type;
		this.offset = 0;
		this.reply = null;
		this.commands = [];
		this.queryQueue = [];
		this.isReadyForQuery = false;
	}

	connect(config, callback) {
		if (config === null || config === undefined) {
			this.connect({});
			return;
		}
		
		this.config = config;
		this.setDefaults();
		this.queryQueue.push({"callback": callback });		
		this.socket = new net.Socket();
		this.socket.setKeepAlive(true, this.config.keepAlive || 300000);
  	this.socket.setTimeout(30000);
  	this.socket.setNoDelay(true);  	
		this.addListeners();
		if (!this.reply) this.reply = new Reply[this.type](this.socket, this.queryQueue);
		this.socket.connect(this.config.port, this.config.host);
	}

	setDefaults() {
		const defaults = Defaults[this.type];
		if (!this.config.host) this.config.host = defaults.host;
		if (!this.config.port) this.config.port = defaults.port;
		if (!this.config.user) this.config.user = defaults.user;
		if (this.config.password === undefined) this.config.password = defaults.password;
		if (!this.config.database) this.config.database = defaults.database;
		if (!this.config.keepAlive) this.config.keepAlive = defaults.keepAlive;
	}

	query() {
		
	}

	commands() {
		return this.commands;
	}

	addQuery(buffer, callback, id, protocol) {
		this.queryQueue.push({
			"buffer": buffer, 
			"callback": callback, 
			"requestId": id, 
			"protocol": protocol 
		});	
		if (this.isReadyForQuery) {		
			this.isReadyForQuery = false;	
			this.reply.processNext();			
		} 
	}

	close() { }

	onConnect(err) {		
		
		var callback;	
		if (this.queryQueue.length > 0) {
			const next = this.queryQueue.shift();	
			callback = next.callback;
		}

		if (err) {
			if (callback) callback(err); 
			return;
		} else {
			if (callback) callback(err, "Connection successful.");
			this.socket.setTimeout(360000);
			this.startup();
		}
	}

	onData(data) {
		this.onPassword(data);			
		this.socket.on("data", (data) => {
			this.handleData(data);
		});
	}

	onReadyForQuery() {
		this.isReadyForQuery = true;		
	}

	onProcessingQuery() {
		this.isReadyForQuery = false;		
	}

	addListeners() {
		this.socket.on("connect", this.onConnect.bind(this));

		this.socket.once("data", this.onData.bind(this));
		
		this.socket.on("readyForQuery", this.onReadyForQuery.bind(this));

		this.socket.on("processingQuery", this.onProcessingQuery.bind(this));

		this.socket.on("error", (err) => {
			if (this.callback) this.callback(err, null);
		});
	}
};

module.exports = Database;
