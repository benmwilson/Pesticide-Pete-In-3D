const { vec2, vec3, mat3, mat4 } = glMatrix;

var program;
var canvas;
var gl;

var positionAttribLocation;
var colorAttribLocation;

var matWorldUniformLocation;
var matViewUniformLocation;
var matProjUniformLocation;

var world;
var view;
var proj;

var dragging = false;
var dx = 0;
var dy = 0;
var lastX;
var lastY;

//UI elements
var scoreLabel;
var livesLabel;

// game related constants
var globe = generateSphereParams(1, 1, 1, 1, 0);


const PLAYER_LOSS_THRESHOLD = 100;
const BACTERIA_COUNT = 1; // amount of bacteria on the canvas

// shape scale/dimensions
const FIELD_SCALE = 0.9; // Scale of the background field relative to the canvas
var currentBacteriaRadius = 0.0; // radius of current bacteria
var bacteriaScale = 0.01; // initial bacteria size, increased each frame

// global game states
var gameWon = false; // true when game is won
var gameLost = false; // true when game is lost
var growthRate = 0.0001;//0.0001

// player state variables
var delay = 0;
var lives = 2;
var playerScore = 0.0; // player score
var bacteriaPosition = []; // store origin coords of each bacteria (Actually represents a rotation value)
var bacteriaHealth = [];
var bacteriaColours = [];

var vertexShaderText = [
	'precision mediump float;',

	'attribute vec3 position;',
	'attribute vec3 color;',
	'uniform mat4 world;',
	'uniform mat4 view;',
	'uniform mat4 proj;',
	'varying vec3 fragColor;',
	'uniform vec3 lightPosition;',
	'varying vec3 surfaceToLight;',

	'void main()',
	'{',
	'   mat4 mvp = proj*view*world;',
	'	fragColor = color;',
	'	gl_Position = mvp*vec4(position,1.0);',
	'	gl_PointSize = 10.0;',
	'}'
].join('\n');

var fragmentShaderText = [
	'precision mediump float;',

	'varying vec3 fragColor;',

	'void main()',
	'{',
	'',
	'	gl_FragColor = vec4(fragColor,1.0);',
	'}',
].join('\n')

var InitGame = function () {
	initWebGLContext()
	initialiazeShaders();
	gl.useProgram(program);
	gl.enable(gl.DEPTH_TEST);
	initializeWorld();
	initBacteria();
	updateBacteria();
	generateBacteriaColors();

	scoreLabel = document.querySelector("#score");
	scoreLabel.innerHTML = "Score: 0";

	livesLabel = document.querySelector("#lives");
	displayLives();

	var angleX = 0;
	var angleY = 0;
	var angleZ = 0;
	var rotz = new Float32Array(16);
	var roty = new Float32Array(16);
	var rotx = new Float32Array(16);

	mat4.identity(rotx);
	mat4.identity(roty);
	mat4.identity(rotz);

	canvas.addEventListener("mousedown", getColor);

	var loop = function () {
		//Mouse drag event
		canvas.onmousedown = mouseDown;
		canvas.onmouseup = mouseUp;
		canvas.onmousemove = mouseMove;

		if (dragging) {
			angleX = 0.01 * dy;
			angleY = 0.01 * dx;
		} else {
			angleX = 0;
			angleY = 0;
		}

		mat4.fromRotation(rotx, angleX, [1, 0, 0]);
		mat4.fromRotation(roty, angleY, [0, 1, 0]);
		mat4.fromRotation(rotz, angleZ, [0, 0, 1]);

		mat4.multiply(world, rotx, world);
		mat4.multiply(world, roty, world);
		//mat4.multiply(world, rotz, world);

		gl.uniformMatrix4fv(matWorldUniformLocation, gl.FALSE, world);
		gl.clearColor(0.5, 0.8, 0.8, 1.0);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

		drawShape(globe.vertices, globe.color, globe.indices);// Draws game area
		updateBacteria();//Draws Bacteria

		if(!gameLost)
			checkLoss();
		
		delay += 1;
		dx = 0;
		dy = 0;
		requestAnimationFrame(loop);
	}
	requestAnimationFrame(loop);

};

function initWebGLContext() {
	canvas = document.getElementById('game-surface');
	gl = canvas.getContext('webgl', { preserveDrawingBuffer: true });

	if (!gl) {
		console.log('webgl not supported, falling back on experimental-webgl');
		gl = canvas.getContext('experimental-webgl');
	}
	if (!gl) {
		alert('your browser does not support webgl');
	}

	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	var screenDimension = Math.min(canvas.width, canvas.height);
	canvas.width = screenDimension;
	canvas.height = screenDimension;
	gl.viewport(0, 0, canvas.width, canvas.height);
}

function initialiazeShaders() {
	vertexShader = gl.createShader(gl.VERTEX_SHADER);
	fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);

	gl.shaderSource(vertexShader, vertexShaderText);
	gl.shaderSource(fragmentShader, fragmentShaderText);

	gl.compileShader(vertexShader);
	if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
		console.error('Error compiling vertex shader!', gl.getShaderInfoLog(vertexShader))
		return;
	}
	gl.compileShader(fragmentShader);
	if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
		console.error('Error compiling vertex shader!', gl.getShaderInfoLog(fragmentShader))
		return;
	}

	program = gl.createProgram();
	gl.attachShader(program, vertexShader);
	gl.attachShader(program, fragmentShader);

	gl.linkProgram(program);
	if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
		console.error('Error linking program!', gl.getProgramInfo(program));
		return;
	}
}

function initializeWorld() {
	world = new Float32Array(16);
	mat4.identity(world);

	view = new Float32Array(16);
	mat4.lookAt(view, [0, 0, 5], [0, 0, 0], [0, 1, 0])

	proj = new Float32Array(16);
	mat4.perspective(proj, glMatrix.glMatrix.toRadian(45), canvas.width / canvas.height, 0.1, 100);

	//get the address of each matrix in the vertex shader
	matWorldUniformLocation = gl.getUniformLocation(program, 'world');
	matViewUniformLocation = gl.getUniformLocation(program, 'view');
	matProjUniformLocation = gl.getUniformLocation(program, 'proj');
}

function drawShape(vertices, colors, indices) {
	//send each matrix to the correct location in vertex shader
	gl.uniformMatrix4fv(matWorldUniformLocation, gl.FALSE, world);
	gl.uniformMatrix4fv(matViewUniformLocation, gl.FALSE, view);
	gl.uniformMatrix4fv(matProjUniformLocation, gl.FALSE, proj);

	// Create and store data into vertex buffer
	var vertex_buffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

	// Create and store data into color buffer
	var color_buffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

	// Create and store data into index buffer
	var index_buffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_buffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

	positionAttribLocation = gl.getAttribLocation(program, 'position');
	colorAttribLocation = gl.getAttribLocation(program, 'color');
	gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
	gl.vertexAttribPointer(
		positionAttribLocation, //attribute location
		3, //number of elements per attribute
		gl.FLOAT,
		gl.FALSE,
		0,
		0
	);
	gl.enableVertexAttribArray(positionAttribLocation);

	gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer);
	gl.vertexAttribPointer(
		colorAttribLocation, //attribute location
		3, //number of elements per attribute
		gl.FLOAT,
		gl.FALSE,
		0,
		0
	);
	gl.enableVertexAttribArray(colorAttribLocation);

	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_buffer);
	gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
}

function pixelInputToCanvasCoord(event) {
	var x = event.clientX,
		y = event.clientY,
		rect = event.target.getBoundingClientRect();
	x = x - rect.left;
	y = rect.bottom - y;
	return { x: x, y: y };
}

function getColor(e) {
	var point = pixelInputToCanvasCoord(e);
	//console.log(point.x, point.y);

	var pixels = new Uint8Array(4);
	gl.readPixels(point.x, point.y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
	// console.log("R: " + pixels[0]);
	// console.log("G: " + pixels[1]);
	// console.log("B: " + pixels[2]);

	removeBacteria(pixels[0], pixels[1], pixels[2]);
}

//https://github.com/davidwparker/programmingtil-webgl/blob/master/0078-3d-sphere/index.js
//Params - portion:
//Number between 0 and 1. Represents drawing a portion of the sphere
//Can create patches this way
function generateSphereParams(size, portion, R, G, B) {
	var SPHERE_DIV = 100;
	var i, ai, si, ci;
	var j, aj, sj, cj;
	var p1, p2;

	// Vertices
	var vertices = [], indices = [];
	for (j = 0; j <= SPHERE_DIV; j++) {
		aj = 2 * j * portion * Math.PI / SPHERE_DIV;
		sj = Math.sin(aj);
		cj = Math.cos(aj);
		for (i = 0; i <= SPHERE_DIV; i++) {
			ai = i * 2 * Math.PI / SPHERE_DIV;
			si = Math.sin(ai);
			ci = Math.cos(ai);

			vertices.push(si * sj);  // X
			vertices.push(cj);       // Y
			vertices.push(ci * sj);  // Z
		}
	}

	//Scale the matrix
	for (var x = 0; x < vertices.length; x++)
		vertices[x] = vertices[x] * size;


	// Indices
	for (j = 0; j < SPHERE_DIV; j++) {
		for (i = 0; i < SPHERE_DIV; i++) {
			p1 = j * (SPHERE_DIV + 1) + i;
			p2 = p1 + (SPHERE_DIV + 1);

			indices.push(p1);
			indices.push(p2);
			indices.push(p1 + 1);

			indices.push(p1 + 1);
			indices.push(p2);
			indices.push(p2 + 1);
		}
	}

	// Selection color
	var color = [];
	for (j = 0; j <= SPHERE_DIV; j++) {
		for (i = 0; i <= SPHERE_DIV; i++) {
			color.push(R);
			color.push(G);
			color.push(B);
			//color.push(1);
		}
	}

	return { vertices: vertices, indices: indices, color: color };
}

function mouseDown(event) {
	dragging = true;
}

function mouseUp(event) {
	dragging = false;
	dx = 0;
	dy = 0;

}

function mouseMove(event) {
	var x = event.clientX;
	var y = event.clientY;

	if (dragging) {
		dx = x - lastX;
		dy = y - lastY;

		// console.log("x: " + x + "	y: " + y);
		// console.log("dx: " + dx + "	dy: " + dy);
		// console.log("lastX: " + lastX + "	lastY: " + lastY);
	}

	lastX = x;
	lastY = y;
}

function initBacteria() {
	for (var x = 0; x < BACTERIA_COUNT; x++)
		generateBacteria(x);
}

function generateBacteria(index) {
	var rotz = new Float32Array(16);
	var roty = new Float32Array(16);
	var rotx = new Float32Array(16);
	var angleX = Math.random() * Math.PI;
	var angleY = Math.random() * Math.PI;
	var angleZ = Math.random() * Math.PI;


	bacteriaPosition[index] = [0, 0, 0];
	bacteriaHealth[index] = 0;
	bacteriaColours[index] = [Math.random(), Math.random(), Math.random()];

	mat4.identity(rotx);
	mat4.identity(roty);
	mat4.identity(rotz);

	mat4.fromRotation(rotx, angleX, [1, 0, 0]);
	mat4.fromRotation(roty, angleY, [0, 1, 0]);
	mat4.fromRotation(rotz, angleZ, [0, 0, 1]);

	mat4.multiply(world, rotx, world);
	mat4.multiply(world, roty, world);
	mat4.multiply(world, rotz, world);

}

function updateBacteria() {
	for (var x = 0; x < bacteriaHealth.length; x++) {
		if (bacteriaHealth[x] <= 1) {
			bacteriaHealth[x] += growthRate;
		} else {
			bacteriaHealth[x] = 1;
		}

		bacteria = generateSphereParams(1.005, bacteriaHealth[x], bacteriaColours[x][0], bacteriaColours[x][1], bacteriaColours[x][2]);
		drawShape(bacteria.vertices, bacteria.color, bacteria.indices);
	}

}

function generateBacteriaColors() {

	for (var x = 0; x < bacteriaColours.length; x++) {
		var red = Math.random()
		var green = Math.random();
		var blue = Math.random();

		bacteriaColours[x][0] = red;
		bacteriaColours[x][1] = green;
		bacteriaColours[x][2] = blue;

		//console.log(bacteriaColours[x][0], bacteriaColours[x][1], bacteriaColours[x][2]);
	}

}

function removeBacteria(r, g, b) {
	for (var x = 0; x < bacteriaColours.length; x++) {
		bacR = Math.round(map_range(bacteriaColours[x][0], 0, 1, 0, 255));
		bacG = Math.round(map_range(bacteriaColours[x][1], 0, 1, 0, 255));
		bacB = Math.round(map_range(bacteriaColours[x][2], 0, 1, 0, 255));
		//console.log("Mouse Color: (" + r + ", " + g + ", " + b + ")");
		//console.log("Bacteria Color: (" + bacR + ", " + bacG + ", " + bacB + ")");
		if (r == bacR && g == bacG && b == bacB) {
			//console.log("Bacteria hit")
			generateBacteria(x);
			growthRate += 0.0001;
			updateScore();
		}
	}
}

function updateScore() {
	playerScore += Math.ceil(600 / delay);
	delay = 0;
	scoreLabel.innerHTML = "Score: " + playerScore;
	//console.log("Score: " + playerScore);
}

function checkLoss() {
	for (var x = 0; x < BACTERIA_COUNT; x++) {
		if (bacteriaHealth[x] >= 0.25) {
			if (lives == 1) {
				growthRate = 0;
				gameLost = true;
				youLose();
				break;
			} else {
				generateBacteria(x);
				lives--;
				window.alert("You let the bacteria eat half the cornfield! Defend the other half!");
				growthRate /= 2;
				displayLives();
			}
		}
	}
}

function displayLives() {
	livesLabel.innerHTML = "Lives left: " + lives;
}

function youLose() {
	console.log("You Lose");
	canvas.removeEventListener("click", getColor);
	livesLabel.innerHTML = "Lives: 0 You Lose!";
	window.alert("You let the bacteria eat all the corn, now the farmer will go hungry! You Lose!!!");

}

function map_range(value, low1, high1, low2, high2) {
	return low2 + (high2 - low2) * (value - low1) / (high1 - low1);
}