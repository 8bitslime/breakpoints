var CompositeDisposable = require("atom").CompositeDisposable;
var path = require("path");
var fs = require("fs");

module.exports = {
	subscriptions: null,
	config: {
		'filename': {
			'description': "Name of the file where breakpoints of the current project will be stored. Changing this will result in all breakpoints being lost (requiers restart).",
			'type': "string",
			'default': ".breakpoints"
		}
	},
	breakpoints: {},
	pointFile: "",
	pointFilePath: "./breakpoints",
	activate: function() {
		this.subscriptions = new CompositeDisposable();
		this.subscriptions.add(atom.commands.add('atom-text-editor', {
			'breakpoints:toggle': () => this.toggle()
		}));
		this.subscriptions.add(atom.commands.add('atom-text-editor', {
			'breakpoints:clear': () => this.removeAll()
		}));
		
		var projectPath = atom.project.getDirectories()[0].path;
		this.pointFilePath = projectPath + '\\' + atom.config.get("Breakpoints.filename");
		this.pointFilePath = path.normalize(this.pointFilePath);
		
		atom.project.onDidChangePaths(function (newPath) {
			this.pointFilePath = newPath + '\\' + atom.config.get("Breakpoints.filename");
			this.pointFilePath = path.normalize(this.pointFilePath);
			this.beginPointFile();
		}.bind(this));
		
		this.beginPointFile();
		atom.workspace.observeTextEditors((editor) => this.addAllPoints(editor));
	},
	beginPointFile: function() {
		for (file in this.breakpoints) {
			for (line in file) {
				line.marker.destroy();
			}
		}
		this.breakpoints = {};
		if (fs.existsSync(this.pointFilePath)) {
			this.pointFile = fs.readFileSync(this.pointFilePath).toString();
			//parse point file
			this.pointFile.split("\n").forEach(function (line) {
				split = line.replace("break ", "").split(":");
				if (!this.breakpoints.hasOwnProperty(split[0])) {
					this.breakpoints[split[0]] = {};
				}
				this.breakpoints[split[0]][parseInt(split[1])] = {};
			}.bind(this));
		}
	},
	addAllPoints: function(editor) {
		var filename = editor.getTitle();
		if (this.breakpoints.hasOwnProperty(filename)) {
			for (line in this.breakpoints[filename]) {
				this.addMarker(editor, line, true);
			}
		}
	},
	removeAll: function() {
		var editor = atom.workspace.getActiveTextEditor();
		var filename = editor.getTitle();
		if (this.breakpoints.hasOwnProperty(filename)) {
			for (marks in this.breakpoints[filename]) {
				this.breakpoints[filename][marks].marker.destroy();
			}
			delete this.breakpoints[filename];
		}
	},
	toggle: function() {
		var editor = atom.workspace.getActiveTextEditor();
		var filename = editor.getTitle();
		if (!this.breakpoints.hasOwnProperty(filename)) {
			this.breakpoints[filename] = {};
		}
		var line = Number(editor.getCursorBufferPosition().row + 1);
		if (!this.breakpoints[filename].hasOwnProperty(line)) {
			this.addMarker(editor, line);
		} else {
			this.removeMarker(editor, line);
		}
	},
	addMarker: function(editor, line, dontWrite) {
		if (!dontWrite) {
			var filename = editor.getTitle();
			this.pointFile += ("break " + filename + ":" + line + "\n");
			fs.writeFile(this.pointFilePath, this.pointFile, function (err) {
				if (err) {
					//error
				}
			});
		}
		
		var marker = editor.markBufferRange([[line-1, 0],[line-1, 0]], {
			'invalidate': 'never'
		});
		editor.decorateMarker(marker, {
			'type': 'line-number',
			'class': 'breakpoint'
		});
		this.breakpoints[editor.getTitle()][line] = {
			'marker': marker
		};
		marker.onDidChange(function(ev) {
			var oldLine = ev.oldHeadBufferPosition.row+1;
			var newLine = ev.newHeadBufferPosition.row+1;
			
			var filename = editor.getTitle();
			this.pointFile = this.pointFile.replace((filename + ":" + oldLine), (filename + ":" + newLine));
			fs.writeFile(this.pointFilePath, this.pointFile, function (err) {
				if (err) {
					//error
				}
			});
			
			var mark = this.breakpoints[editor.getTitle()][oldLine];
			this.breakpoints[editor.getTitle()][newLine] = mark;
			delete this.breakpoints[editor.getTitle()][oldLine];
		}.bind(this));
	},
	removeMarker: function(editor, line) {
		var filename = editor.getTitle();
		this.pointFile = this.pointFile.replace(("break " + filename + ":" + line + "\n"), "");
		fs.writeFile(this.pointFilePath, this.pointFile, function (err) {
			if (err) {
				//error
			}
		});
		this.breakpoints[filename][line].marker.destroy();
		delete this.breakpoints[filename][line];
	},
};
