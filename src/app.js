const { vec2, vec3, mat3, mat4 } = glMatrix;

var vertexShaderText = [
'precision mediump float;',

'attribute vec3 vertPosition;',
'attribute vec3 vertColor;',
'uniform mat4 world;',
'uniform mat4 view;',
'uniform mat4 proj;',
'varying vec3 fragColor;',

'void main()',
'{',
'   mat4 mvp = proj*view*world;',
'	fragColor = vertColor;',
'	gl_Position = mvp*vec4(vertPosition,1.0);',
'	gl_PointSize = 10.0;',
'}'
].join('\n');

var fragmentShaderText =
[
'precision mediump float;',

'varying vec3 fragColor;',

'void main()',
'{',
	
'	gl_FragColor = vec4(fragColor,1.0);',
'}',
].join('\n')


var InitDemo = function() {


	//////////////////////////////////
	//       initialize WebGL       //
	//////////////////////////////////
	console.log('this is working');

	var canvas = document.getElementById('game-surface');
	var gl = canvas.getContext('webgl');

	if (!gl){
		console.log('webgl not supported, falling back on experimental-webgl');
		gl = canvas.getContext('experimental-webgl');
	}
	if (!gl){
		alert('your browser does not support webgl');
	}

	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	gl.viewport(0,0,canvas.width,canvas.height);

	gl.clearColor(0.5,0.8,0.8,1.0);
	gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);

	//////////////////////////////////
	// create/compile/link shaders  //
	//////////////////////////////////
	var vertexShader = gl.createShader(gl.VERTEX_SHADER);
	var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);

	gl.shaderSource(vertexShader,vertexShaderText);
	gl.shaderSource(fragmentShader,fragmentShaderText);

	gl.compileShader(vertexShader);
	if(!gl.getShaderParameter(vertexShader,gl.COMPILE_STATUS)){
		console.error('Error compiling vertex shader!', gl.getShaderInfoLog(vertexShader))
		return;
	}
	gl.compileShader(fragmentShader);
		if(!gl.getShaderParameter(fragmentShader,gl.COMPILE_STATUS)){
		console.error('Error compiling vertex shader!', gl.getShaderInfoLog(fragmentShader))
		return;
	}

	var program = gl.createProgram();
	gl.attachShader(program,vertexShader);
	gl.attachShader(program,fragmentShader);

	gl.linkProgram(program);
	if(!gl.getProgramParameter(program,gl.LINK_STATUS)){
		console.error('Error linking program!', gl.getProgramInfo(program));
		return;
	}

	//////////////////////////////////
	//    create triangle buffer    //
	//////////////////////////////////

	//all arrays in JS is Float64 by default
	var triangleVertices = [
		//X,   Y,  Z    R, G, B
		0.0,  0.5, 0,   1, 0, 0,
		-0.5,-0.5, 0,   0, 1, 0,
		0.5, -0.5, 0,   0, 0, 1
	];

	var triangleVertexBufferObject = gl.createBuffer();
	//set the active buffer to the triangle buffer
	gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexBufferObject);
	//gl expecting Float32 Array not Float64
	//gl.STATIC_DRAW means we send the data only once (the triangle vertex position
	//will not change over time)
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangleVertices),gl.STATIC_DRAW);

	var positionAttribLocation = gl.getAttribLocation(program,'vertPosition');
	var colorAttribLocation = gl.getAttribLocation(program,'vertColor');
	gl.vertexAttribPointer(
		positionAttribLocation, //attribute location
		3, //number of elements per attribute
		gl.FLOAT, 
		gl.FALSE,
		6*Float32Array.BYTES_PER_ELEMENT,//size of an individual vertex
		0*Float32Array.BYTES_PER_ELEMENT//offset from the beginning of a single vertex to this attribute
		);
	gl.vertexAttribPointer(
		colorAttribLocation, //attribute location
		3, //number of elements per attribute
		gl.FLOAT, 
		gl.FALSE,
		6*Float32Array.BYTES_PER_ELEMENT,//size of an individual vertex
		3*Float32Array.BYTES_PER_ELEMENT//offset from the beginning of a single vertex to this attribute
		);
	gl.enableVertexAttribArray(positionAttribLocation);
	gl.enableVertexAttribArray(colorAttribLocation);

	gl.useProgram(program);
	//////////////////////////////////
	//          math things         //
	//////////////////////////////////
	
	var world = new Float32Array(16);
	mat4.identity(world);

	var view = new Float32Array(16);
	mat4.lookAt(view, [0,0,5], [0,0,0],[0,1,0])

	var proj = new Float32Array(16);
	mat4.perspective(proj,glMatrix.glMatrix.toRadian(45),canvas.width/canvas.height,0.1,100);

	//get the address of each matrix in the vertex shader
	var matWorldUniformLocation = gl.getUniformLocation(program, 'world');
	var matViewUniformLocation = gl.getUniformLocation(program, 'view');
	var matProjUniformLocation = gl.getUniformLocation(program, 'proj');

	//send each matrix to the correct location in vertex shader
	gl.uniformMatrix4fv(matWorldUniformLocation, gl.FALSE, world);
	gl.uniformMatrix4fv(matViewUniformLocation, gl.FALSE, view);
	gl.uniformMatrix4fv(matProjUniformLocation, gl.FALSE, proj);

	//////////////////////////////////
	//       Main render loop       //
	//////////////////////////////////
	var angle = 0;
	var rot = new Float32Array(16);
	var trans = new Float32Array(16);
	
	//mat4.identity(rot);
	//mat4.identity(trans);

	var x = -2;

	var loop = function(){
		
		//angle = performance.now() / 1000;

		angle = 45*Math.PI/180;
		mat4.fromRotation(rot,angle,[0,0,1]);
		mat4.fromTranslation(trans,[x,0,0]);
		//mat4.multiply(world,rot,trans);
		mat4.multiply(world,trans,rot);
		gl.uniformMatrix4fv(matWorldUniformLocation, gl.FALSE, world);
		
		gl.clearColor(0.5,0.8,0.8,1.0);
		gl.clear(gl.COLOR_BUFFER_BIT);
		gl.drawArrays(gl.TRIANGLES,0,3);
		
		//call loop function whenever a frame is ready for drawing, usually it is 60fps.
		//Also, if the tab is not focused loop function will not be called
		requestAnimationFrame(loop);
	};
	requestAnimationFrame(loop);

	window.onkeypress = function(event){
		if (event.key == 'd')
			x = x-0.01;

		if (event.key == 'a')
			x = x+0.01;
		
	}
};