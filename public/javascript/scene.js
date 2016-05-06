'use strict';

// Array flattening trick from http://stackoverflow.com/questions/10865025/merge-flatten-a-multidimensional-array-in-javascript

var AppScene = function (gl) {
	this.gl = gl;
};

AppScene.prototype.loadApp = function (cb) {
	console.log('Loading demo scene');

	var me = this;

	async.parallel({
		Models: function (callback) {
			async.map({
				RoomModel: 'model/Room.json'
			}, LoadJSONResource, callback);
		},
		ShaderCode: function (callback) {
			async.map({
				'woShadow_VSText': 'shader/woShadow.vs.glsl',
				'woShadow_FSText': 'shader/woShadow.fs.glsl',
				'reShadow_VSText': 'shader/reShadow.vs.glsl',
				'reShadow_FSText': 'shader/reShadow.fs.glsl',
				'genShadow_VSText': 'shader/genShadow.vs.glsl',
				'genShadow_FSText': 'shader/genShadow.fs.glsl'
			}, LoadTextResource, callback);
		}
	}, function (loadErrors, loadResults) {
		if (loadErrors) {
			cb(loadErrors);
			return;
		}

		//
		// Create Model objects
		//
		for (var i = 0; i < loadResults.Models.RoomModel.meshes.length; i++) {
			var mesh = loadResults.Models.RoomModel.meshes[i];
			switch (mesh.name) {
				case 'ChairMesh':
				me.ChairMesh = new Model(me.gl,
							mesh.vertices,
							[].concat.apply([], mesh.faces),
							mesh.normals ,
							vec4.fromValues(0.623529,0.623529,0.372549,1.0)
						);
				//console.log(loadResults);
						mat4.translate(
							me.ChairMesh.world,
							me.ChairMesh.world,
							vec3.fromValues(2.4,-3.54703,0.83452)
							);
						mat4.rotate(
							me.ChairMesh.world,
							me.ChairMesh.world,
							glMatrix.toRadian(234),
							vec3.fromValues(-0.001,-3.9,0.0)
							);
						mat4.scale(
							me.ChairMesh.world,
							me.ChairMesh.world,
							vec3.fromValues(0.32,-0.42,-0.32)
							);
					
				break;
				case 'TableMesh':
					me.TableMesh = new Model(me.gl,
							mesh.vertices,
							[].concat.apply([], mesh.faces),
							mesh.normals,
							vec4.fromValues(0.65, 0.51, 0.39, 1.0)
						);
					mat4.translate(
						me.TableMesh.world,
						me.TableMesh.world,
						vec3.fromValues(-2.9,-1.38353,0.4)
						);
					break;
				case 'MonkeyMesh':
					me.MonkeyMesh = new Model(me.gl,
							mesh.vertices,
							[].concat.apply([], mesh.faces),
							mesh.normals,
							vec4.fromValues(0.878431, 0.066667, 0.372549, 1.0)
						);
					mat4.rotate(
						me.MonkeyMesh.world,
						me.MonkeyMesh.world,
						glMatrix.toRadian(47.314),
						vec3.fromValues(0.0,0.0,1.0)
						);
					mat4.translate(
						me.MonkeyMesh.world,
						me.MonkeyMesh.world,
						vec3.fromValues(-3.18519,1.26438,1.33526)
						);
					break;
				case 'SofaMesh':
					me.SofaMesh = new Model(me.gl,
							mesh.vertices,
							[].concat.apply([], mesh.faces),
							mesh.normals,
							vec4.fromValues(0.678431, 0.917647, 0.917647, 1.0)
						);
					mat4.translate(
						me.SofaMesh.world,
						me.SofaMesh.world,
						vec3.fromValues(0.28768,5,0.77518)
						);
					mat4.rotate(me.SofaMesh.world,
						me.SofaMesh.world,
						glMatrix.toRadian(270.938),
						vec3.fromValues(0.0,0.0,1.0)
						);
					
					break;
				case 'LightBulbMesh':
					me.LightPosition = vec3.fromValues(-0.0000002,0.0,2.77959);
					me.LightBulbMesh = new Model(me.gl,
							mesh.vertices,
							[].concat.apply([], mesh.faces),
							mesh.normals,
							vec4.fromValues(4, 4, 4, 1.0)
						);
					mat4.translate(
						me.LightBulbMesh.world,
						me.LightBulbMesh.world,
						me.LightPosition
						);
					break;
				case 'WallsMesh':
					me.WallsMesh = new Model(
						me.gl, mesh.vertices, [].concat.apply([], mesh.faces),
						mesh.normals, vec4.fromValues(0.329412, 0.329412, 0.329412, 1)
					);
					break;
			}
		}

		if(!me.ChairMesh)
		{
			cb('Failed to load chair mesh'); return;
		}
		if (!me.MonkeyMesh)
		{
			cb('Failed to load monkey mesh'); return;
		}
		if (!me.TableMesh)
		{
			cb('Failed to load table mesh'); return;
		}
		if (!me.SofaMesh)
		{
			cb('Failed to load sofa mesh'); return;
		}
		if (!me.LightBulbMesh)
		{
			cb('Failed to load light mesh'); return;
		}
		if (!me.WallsMesh)
		{
			cb('Failed to load walls mesh'); return;
		}

		me.MESHES = [
		me.ChairMesh,
		me.TableMesh,
		me.MonkeyMesh,
		me.SofaMesh,
		me.LightBulbMesh,
		me.WallsMesh,
		];


		//CreateShaderProgram = function (gl, vsText, fsText)
		
		me.NoShadowProgram = CreateShaderProgram(
			me.gl, loadResults.ShaderCode.woShadow_VSText,
			loadResults.ShaderCode.woShadow_FSText
		);
		if (me.NoShadowProgram.error) {
			cb('NoShadowProgram ' + me.NoShadowProgram.error); return;
		}

		me.ShadowProgram = CreateShaderProgram(
			me.gl, loadResults.ShaderCode.reShadow_VSText,
			loadResults.ShaderCode.reShadow_FSText
		);
		if (me.ShadowProgram.error) {
			cb('ShadowProgram ' + me.ShadowProgram.error); return;
		}

		me.ShadowMapGenProgram = CreateShaderProgram(
			me.gl, loadResults.ShaderCode.genShadow_VSText,
			loadResults.ShaderCode.genShadow_FSText
		);
		if (me.ShadowMapGenProgram.error) {
			cb('ShadowMapGenProgram ' + me.ShadowMapGenProgram.error); return;
		}

		me.NoShadowProgram.uniforms = {
			mProj: me.gl.getUniformLocation(me.NoShadowProgram, 'mProj'),
			mView: me.gl.getUniformLocation(me.NoShadowProgram, 'mView'),
			mWorld: me.gl.getUniformLocation(me.NoShadowProgram, 'mWorld'),

			pointLightPosition: me.gl.getUniformLocation(me.NoShadowProgram, 'pointLightPosition'),
			meshColor: me.gl.getUniformLocation(me.NoShadowProgram, 'meshColor'),
		};
		me.NoShadowProgram.attribs = {
			vPos: me.gl.getAttribLocation(me.NoShadowProgram, 'vPos'),
			vNorm: me.gl.getAttribLocation(me.NoShadowProgram, 'vNorm'),
		};

		me.ShadowProgram.uniforms = {
			mProj: me.gl.getUniformLocation(me.ShadowProgram, 'mProj'),
			mView: me.gl.getUniformLocation(me.ShadowProgram, 'mView'),
			mWorld: me.gl.getUniformLocation(me.ShadowProgram, 'mWorld'),

			pointLightPosition: me.gl.getUniformLocation(me.ShadowProgram, 'pointLightPosition'),
			meshColor: me.gl.getUniformLocation(me.ShadowProgram, 'meshColor'),
			lightShadowMap: me.gl.getUniformLocation(me.ShadowProgram, 'lightShadowMap'),
			shadowClipNearFar: me.gl.getUniformLocation(me.ShadowProgram, 'shadowClipNearFar'),

			bias: me.gl.getUniformLocation(me.ShadowProgram, 'bias')
		};
		me.ShadowProgram.attribs = {
			vPos: me.gl.getAttribLocation(me.ShadowProgram, 'vPos'),
			vNorm: me.gl.getAttribLocation(me.ShadowProgram, 'vNorm'),
		};

		me.ShadowMapGenProgram.uniforms = {
			mProj: me.gl.getUniformLocation(me.ShadowMapGenProgram, 'mProj'),
			mView: me.gl.getUniformLocation(me.ShadowMapGenProgram, 'mView'),
			mWorld: me.gl.getUniformLocation(me.ShadowMapGenProgram, 'mWorld'),

			pointLightPosition: me.gl.getUniformLocation(me.ShadowMapGenProgram, 'pointLightPosition'),
			shadowClipNearFar: me.gl.getUniformLocation(me.ShadowMapGenProgram, 'shadowClipNearFar'),
		};
		me.ShadowMapGenProgram.attribs = {
			vPos: me.gl.getAttribLocation(me.ShadowMapGenProgram, 'vPos'),
		};

		me.shadowMapCube = me.gl.createTexture();
		me.gl.bindTexture(me.gl.TEXTURE_CUBE_MAP, me.shadowMapCube);
		me.gl.texParameteri(me.gl.TEXTURE_CUBE_MAP, me.gl.TEXTURE_MIN_FILTER, me.gl.LINEAR);
		me.gl.texParameteri(me.gl.TEXTURE_CUBE_MAP, me.gl.TEXTURE_MAG_FILTER, me.gl.LINEAR);
		me.gl.texParameteri(me.gl.TEXTURE_CUBE_MAP, me.gl.TEXTURE_WRAP_S, me.gl.MIRRORED_REPEAT);
		me.gl.texParameteri(me.gl.TEXTURE_CUBE_MAP, me.gl.TEXTURE_WRAP_T, me.gl.MIRRORED_REPEAT);
		me.floatExtension = me.gl.getExtension("OES_texture_float");
		me.floatLinearExtension = me.gl.getExtension("OES_texture_float_linear");
		if (me.floatExtension && me.floatLinearExtension) {
			for (var i = 0; i < 6; i++) {
				me.gl.texImage2D(
					me.gl.TEXTURE_CUBE_MAP_POSITIVE_X + i,
					0, me.gl.RGBA,
					me.textureSize, me.textureSize,
					0, me.gl.RGBA,
					me.gl.FLOAT, null
				);
			}
		} else {
			for (var i = 0; i < 6; i++) {
				me.gl.texImage2D(
					me.gl.TEXTURE_CUBE_MAP_POSITIVE_X + i,
					0, me.gl.RGBA,
					me.textureSize, me.textureSize,
					0, me.gl.RGBA,
					me.gl.UNSIGNED_BYTE, null
				);
			}
		}

		me.shadowMapFramebuffer = me.gl.createFramebuffer();
		me.gl.bindFramebuffer(me.gl.FRAMEBUFFER, me.shadowMapFramebuffer);

		me.shadowMapRenderbuffer = me.gl.createRenderbuffer();
		me.gl.bindRenderbuffer(me.gl.RENDERBUFFER, me.shadowMapRenderbuffer);
		me.gl.renderbufferStorage(
			me.gl.RENDERBUFFER, me.gl.DEPTH_COMPONENT16,
			me.textureSize, me.textureSize
		);

		me.gl.bindTexture(me.gl.TEXTURE_CUBE_MAP, null);
		me.gl.bindRenderbuffer(me.gl.RENDERBUFFER, null);
		me.gl.bindFramebuffer(me.gl.FRAMEBUFFER, null);

		//camera
		// Camera = function (position, lookAt, up)
		
		//
		// Logical Values
		//
		me.camera = new Camera(
			vec3.fromValues(-1, 0, 1.85),
			vec3.fromValues(-0.3, -1, 1.85),
			vec3.fromValues(0, 0, 1)
		);

		me.projMatrix = mat4.create();
		me.viewMatrix = mat4.create();

		mat4.perspective(
			me.projMatrix,
			glMatrix.toRadian(90),
			me.gl.canvas.width / me.gl.canvas.height,
			0.35,
			85.0
		);

		me.shadowMapCameras = [
			// Positive X
			new Camera(
				me.LightPosition,
				vec3.add(vec3.create(), me.LightPosition, vec3.fromValues(1, 0, 0)),
				vec3.fromValues(0, -1, 0)
			),
			// Negative X
			new Camera(
				me.LightPosition,
				vec3.add(vec3.create(), me.LightPosition, vec3.fromValues(-1, 0, 0)),
				vec3.fromValues(0, -1, 0)
			),
			// Positive Y
			new Camera(
				me.LightPosition,
				vec3.add(vec3.create(), me.LightPosition, vec3.fromValues(0, 1, 0)),
				vec3.fromValues(0, 0, 1)
			),
			// Negative Y
			new Camera(
				me.LightPosition,
				vec3.add(vec3.create(), me.LightPosition, vec3.fromValues(0, -1, 0)),
				vec3.fromValues(0, 0, -1)
			),
			// Positive Z
			new Camera(
				me.LightPosition,
				vec3.add(vec3.create(), me.LightPosition, vec3.fromValues(0, 0, 1)),
				vec3.fromValues(0, -1, 0)
			),
			// Negative Z
			new Camera(
				me.LightPosition,
				vec3.add(vec3.create(), me.LightPosition, vec3.fromValues(0, 0, -1)),
				vec3.fromValues(0, -1, 0)
			),
		];
		me.shadowMapViewMatrices = [
			mat4.create(),
			mat4.create(),
			mat4.create(),
			mat4.create(),
			mat4.create(),
			mat4.create()
		];
		me.shadowMapProj = mat4.create();
		me.shadowClipNearFar = vec2.fromValues(0.05, 15.0);
		mat4.perspective(
			me.shadowMapProj,
			glMatrix.toRadian(90),
			1.0,
			me.shadowClipNearFar[0],
			me.shadowClipNearFar[1]
		);

		cb();
	});
	
	me.PressedKeys = {
		UP: false,
		DOWN: false,
		RIGHT: false,
		LEFT: false,
		
		ROTATE_LEFT: false,
		ROTATE_RIGHT: false,
		
		FORWARD: false,
		BACK: false
	};

	me.FORWARD_SPEED = 3.5;
	me.ROTATE_SPEED = 1.5;
	me.textureSize = getParameterByName('texSize') || 512;
	me.lightDisplacementInputAngle = 0.0;
	me.isTouch = false;

	me.forward_b = document.getElementById('forward');
	me.right_b = document.getElementById('right'); 
	me.left_b = document.getElementById('left');
	me.back_b = document.getElementById('back');
	me.rotateLeft_b = document.getElementById('rLeft');
	me.rotateRight_b = document.getElementById('rRight');

}
/*
var forward = document.getElementById('forward');
	forward.addEventListener("touchstart", function(e){
		e.preventDefault();
		console.log(e);
		return false;
	}, false);
	forward.addEventListener("touchend", function(e){
		e.preventDefault();
		console.log('end');
		return false;
	}, false);
*/
AppScene.prototype.unloadApp = function() 
{
		this.LightBulbMesh = null;
		this.MonkeyMesh = null;
		this.WallsMesh = null;
		this.ChairMesh = null;
		this.TableMesh = null;
		this.MESHES = null;
		this.PressedKeys = null;
		this.camera = null;
		this.LightPosition = null;
		this.FORWARD_SPEED = null;
		this.ROTATE_SPEED = null;
		this.NoShadowProgram = null;
		this.ShadowProgram = null;
		this.ShadowMapGenProgram = null;
		this.shadowMapCameras = null;
		this.shadowMapViewMatrices = null;
		this.shadowMapCube = null;
		this.textureSize = null;
		this.isTouch = null;
		this.forward_b = null;
		this.right_b = null;
		this.left_b = null;
		this.back_b = null;
		this.rotateLeft_b = null;
		this.rotateRight_b = null;


};

AppScene.prototype.startApp = function() 
{
	console.log('startApp scene');


	//solution from http://stackoverflow.com/questions/4817029/whats-the-best-way-to-detect-a-touch-screen-device-using-javascript
	//by david's answer
	this.isTouch = (('ontouchstart' in window) || (navigator.msMaxTouchPoints > 0));
	console.log(this.isTouch);
	
	var me = this;
	//keyboard
	this.__ResizeWindowListener = this._onResizeWindow.bind(this);
	this.__KeyDownWindowListener = this._OnKeyDown.bind(this);
	this.__KeyUpWindowListener = this._OnKeyUp.bind(this);
	//touch
	this.__TouchStartForward = this._TouchStartForward.bind(this);
	this.__TouchEndForward = this._TouchEndForward.bind(this);
	
	this.__TouchStartBack = this._TouchStartBack.bind(this);
	this.__TouchEndBack = this._TouchEndBack.bind(this);
	
	this.__TouchStartRight = this._TouchStartRight.bind(this);
	this.__TouchEndRight = this._TouchEndRight.bind(this);
	
	this.__TouchStartLeft = this._TouchStartLeft.bind(this);
	this.__TouchEndLeft = this._TouchEndLeft.bind(this);
	
	this.__TouchStartRleft = this._TouchStartRleft.bind(this);
	this.__TouchEndRleft = this._TouchEndRleft.bind(this);

	this.__TouchStartRright = this._TouchStartRright.bind(this);
	this.__TouchEndRright = this._TouchEndRright.bind(this);

	//AddEvent(window,'resize',this.__ResizeWindowListener)
	AddEvent(window, 'resize', this.__ResizeWindowListener);
	AddEvent(window, 'keydown', this.__KeyDownWindowListener);
	AddEvent(window, 'keyup', this.__KeyUpWindowListener);

	//touchscreen supported
	if(this.isTouch)
	{
		AddEvent(this.forward_b, 'touchstart', this.__TouchStartForward);
		AddEvent(this.forward_b, 'touchend', this.__TouchEndForward);

		AddEvent(this.back_b, 'touchstart',this.__TouchStartBack);
		AddEvent(this.back_b, 'touchend',this.__TouchEndBack);

		AddEvent(this.right_b, 'touchstart',this.__TouchStartRight);
		AddEvent(this.right_b, 'touchend',this.__TouchEndRight);

		AddEvent(this.left_b, 'touchstart',this.__TouchStartLeft);
		AddEvent(this.left_b, 'touchend',this.__TouchEndLeft);

		AddEvent(this.rotateLeft_b, 'touchstart',this.__TouchStartRleft);
		AddEvent(this.rotateLeft_b, 'touchend',this.__TouchEndRleft);

		AddEvent(this.rotateRight_b, 'touchstart',this.__TouchStartRright);
		AddEvent(this.rotateRight_b, 'touchend',this.__TouchEndRright);
	}

	var prevTime = performance.now();
	var dt = 0;
	//console.log(this.LightBulbMesh);
	var loop = function (currentFrameTime)
	{

		dt = currentFrameTime - prevTime;
		me._update(dt);
		prevTime = currentFrameTime;

		me._generateShadowMap();
		me._render();
		me.nextFHandle = requestAnimationFrame(loop);
	};
	me.nextFHandle = requestAnimationFrame(loop);
	
	me._onResizeWindow();
};

AppScene.prototype.endApp = function() 
{
	this.nextFHandle && cancelAnimationFrame(this.nextFHandle);

	if (this.__ResizeWindowListener) {
		RemoveEvent(window, 'resize', this.__ResizeWindowListener);
	}
	if (this.__KeyUpWindowListener) {
		RemoveEvent(window, 'keyup', this.__KeyUpWindowListener);
	}
	if (this.__KeyDownWindowListener) {
		RemoveEvent(window, 'keydown', this.__KeyDownWindowListener);
	}
};

AppScene.prototype._update = function(dt)
{
	mat4.rotateZ(
		this.MonkeyMesh.world, this.MonkeyMesh.world, dt / 1000 * 2 * Math.PI * 0.3);
	if((this.PressedKeys.FORWARD && !this.PressedKeys.BACK))
	{

		this.camera.moveForward(dt / 1000 * this.FORWARD_SPEED);
	}
	if(!this.PressedKeys.FORWARD && this.PressedKeys.BACK)
	{
		this.camera.moveForward(-dt / 1000 * this.FORWARD_SPEED);
	}
	if(this.PressedKeys.RIGHT && !this.PressedKeys.LEFT)
	{
		this.camera.moveRight(dt / 1000 * this.FORWARD_SPEED);	
	}
	if(!this.PressedKeys.RIGHT && this.PressedKeys.LEFT)
	{
		this.camera.moveRight(-dt / 1000 * this.FORWARD_SPEED);	
	}
	if(this.PressedKeys.ROTATE_RIGHT && !this.PressedKeys.ROTATE_LEFT)
	{
		this.camera.rotateRight(-dt / 1000 * this.ROTATE_SPEED);	
	}
	if(!this.PressedKeys.ROTATE_RIGHT && this.PressedKeys.ROTATE_LEFT)
	{
		this.camera.rotateRight(dt / 1000 * this.ROTATE_SPEED);	
	}
	if(this.PressedKeys.UP && !this.PressedKeys.DOWN)
	{
		this.camera.moveUp(dt / 1000 * this.ROTATE_SPEED);	
	}
	if(!this.PressedKeys.UP && this.PressedKeys.DOWN)
	{
		this.camera.moveUp(-dt / 1000 * this.ROTATE_SPEED);	
	}

	this.lightDisplacementInputAngle += dt / 2337;
	var zDisplacement = Math.cos(this.lightDisplacementInputAngle) * 4.8;
	var xDisplacement = Math.sin(this.lightDisplacementInputAngle) * 3.3;


	this.LightBulbMesh.world[12] = xDisplacement;
	this.LightBulbMesh.world[13] = zDisplacement;
	for (var i = 0; i < this.shadowMapCameras.length; i++) {
		mat4.getTranslation(this.shadowMapCameras[i].position, this.LightBulbMesh.world);
		this.shadowMapCameras[i].GetViewMatrix(this.shadowMapViewMatrices[i]);
	}

	this.camera.GetViewMatrix(this.viewMatrix);
};

AppScene.prototype._generateShadowMap = function()
{
	var gl = this.gl;

	// Set GL state status
	gl.useProgram(this.ShadowMapGenProgram);
	gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.shadowMapCube);
	gl.bindFramebuffer(gl.FRAMEBUFFER, this.shadowMapFramebuffer);
	gl.bindRenderbuffer(gl.RENDERBUFFER, this.shadowMapRenderbuffer);

	gl.viewport(0, 0, this.textureSize, this.textureSize);
	gl.enable(gl.DEPTH_TEST);
	gl.enable(gl.CULL_FACE);

	// Set per-frame uniforms
	gl.uniform2fv(
		this.ShadowMapGenProgram.uniforms.shadowClipNearFar,
		this.shadowClipNearFar
	);
	gl.uniform3fv(
		this.ShadowMapGenProgram.uniforms.pointLightPosition,
		this.LightPosition
	);
	gl.uniformMatrix4fv(
		this.ShadowMapGenProgram.uniforms.mProj,
		gl.FALSE,
		this.shadowMapProj
	);

	for (var i = 0; i < this.shadowMapCameras.length; i++) {
		// Set per light uniforms
		gl.uniformMatrix4fv(
			this.ShadowMapGenProgram.uniforms.mView,
			gl.FALSE,
			this.shadowMapCameras[i].GetViewMatrix(this.shadowMapViewMatrices[i])
		);

		// Set framebuffer destination
		gl.framebufferTexture2D(
			gl.FRAMEBUFFER,
			gl.COLOR_ATTACHMENT0,
			gl.TEXTURE_CUBE_MAP_POSITIVE_X + i,
			this.shadowMapCube,
			0
		);
		gl.framebufferRenderbuffer(
			gl.FRAMEBUFFER,
			gl.DEPTH_ATTACHMENT,
			gl.RENDERBUFFER,
			this.shadowMapRenderbuffer
		);

		gl.clearColor(0, 0, 0, 1);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

		// Draw meshes
		for (var j = 0; j < this.MESHES.length; j++) {
			// Per object uniforms
			gl.uniformMatrix4fv(
				this.ShadowMapGenProgram.uniforms.mWorld,
				gl.FALSE,
				this.MESHES[j].world
			);

			// Set attributes
			gl.bindBuffer(gl.ARRAY_BUFFER, this.MESHES[j].vbo);
			gl.vertexAttribPointer(
				this.ShadowMapGenProgram.attribs.vPos,
				3, gl.FLOAT, gl.FALSE,
				0, 0
			);
			gl.enableVertexAttribArray(this.ShadowMapGenProgram.attribs.vPos);

			gl.bindBuffer(gl.ARRAY_BUFFER, null);

			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.MESHES[j].ibo);
			gl.drawElements(gl.TRIANGLES, this.MESHES[j].nPoints, gl.UNSIGNED_SHORT, 0);
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
		}
	}

	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	gl.bindRenderbuffer(gl.RENDERBUFFER, null);
	gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
};

AppScene.prototype._render = function()
{
	var gl = this.gl;

// Clear back buffer, set per-frame uniforms
	gl.enable(gl.CULL_FACE);
	gl.enable(gl.DEPTH_TEST);

	gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

	gl.clearColor(0, 0, 0, 1);
	gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);

	gl.useProgram(this.ShadowProgram);
	gl.uniformMatrix4fv(this.ShadowProgram.uniforms.mProj, gl.FALSE, this.projMatrix);
	gl.uniformMatrix4fv(this.ShadowProgram.uniforms.mView, gl.FALSE, this.viewMatrix);
	gl.uniform3fv(this.ShadowProgram.uniforms.pointLightPosition, this.LightPosition);
	gl.uniform2fv(this.ShadowProgram.uniforms.shadowClipNearFar, this.shadowClipNearFar);
	if (this.floatExtension && this.floatLinearExtension) {
		gl.uniform1f(this.ShadowProgram.uniforms.bias, 0.001);
	} else {
		gl.uniform1f(this.ShadowProgram.uniforms.bias, 0.003);
	}
	gl.uniform1i(this.ShadowProgram.uniforms.lightShadowMap, 0);
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.shadowMapCube);

	// Draw meshes
	for (var i = 0; i < this.MESHES.length; i++) {
		// Per object uniforms
		gl.uniformMatrix4fv(
			this.ShadowProgram.uniforms.mWorld,
			gl.FALSE,
			this.MESHES[i].world
		);
		gl.uniform4fv(
			this.ShadowProgram.uniforms.meshColor,
			this.MESHES[i].color
		);

		// Set attributes
		gl.bindBuffer(gl.ARRAY_BUFFER, this.MESHES[i].vbo);
		gl.vertexAttribPointer(
			this.ShadowProgram.attribs.vPos,
			3, gl.FLOAT, gl.FALSE,
			0, 0
		);
		gl.enableVertexAttribArray(this.ShadowProgram.attribs.vPos);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.MESHES[i].nbo);
		gl.vertexAttribPointer(
			this.ShadowProgram.attribs.vNorm,
			3, gl.FLOAT, gl.FALSE,
			0, 0
		);
		gl.enableVertexAttribArray(this.ShadowProgram.attribs.vNorm);		

		gl.bindBuffer(gl.ARRAY_BUFFER, null);

		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.MESHES[i].ibo);
		gl.drawElements(gl.TRIANGLES, this.MESHES[i].nPoints, gl.UNSIGNED_SHORT, 0);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
	}
};


AppScene.prototype._onResizeWindow = function()
{
	var gl= this.gl;

	var targetHeight = window.innerWidth * 9/16;
	//console.log(this.isTouch);
	if(this.isTouch)
	{
		document.getElementById('button-area1').style.display = "inline-block";
		document.getElementById('button-area2').style.display = "inline-block";
		if(window.innerWidth <=610) 
		{
			// Center vertically
			console.log(window.innerWidth);
			gl.canvas.width = window.innerWidth;
			gl.canvas.height = window.innerWidth;
			gl.canvas.style.left = (window.innerWidth - (gl.canvas.width)) / 2 + 'px';
			gl.canvas.style.top = '0px';
		} 
		else
		{
			if(window.innerHeight > targetHeight) 
			{
				// Center vertically
				gl.canvas.width = window.innerWidth;
				gl.canvas.height = targetHeight;
				gl.canvas.style.left = '0px';
				gl.canvas.style.top = (window.innerHeight - targetHeight) / 2 + 'px';
			} 
			else 
			{
				// Center horizontally
				gl.canvas.width = window.innerHeight * 16 / 9;
				gl.canvas.height = window.innerHeight;
				gl.canvas.style.left = (window.innerWidth - (gl.canvas.width)) / 2 + 'px';
				gl.canvas.style.top = '0px';
			}
		}
	}
	else{
		if(window.innerHeight > targetHeight) 
		{
			// Center vertically
			gl.canvas.width = window.innerWidth;
			gl.canvas.height = targetHeight;
			gl.canvas.style.left = '0px';
			gl.canvas.style.top = (window.innerHeight - targetHeight) / 2 + 'px';
		} 
		else 
		{
			// Center horizontally
			gl.canvas.width = window.innerHeight * 16 / 9;
			gl.canvas.height = window.innerHeight;
			gl.canvas.style.left = (window.innerWidth - (gl.canvas.width)) / 2 + 'px';
			gl.canvas.style.top = '0px';
		}
	}
	

	gl.viewport(0,0,gl.canvas.width,gl.canvas.height);
};

AppScene.prototype._OnKeyDown = function (e) {
	
	switch(e.keyCode)
	{
		case 87:
		this.PressedKeys.FORWARD = true;
		break;
		case 83:
		this.PressedKeys.BACK = true;
		break;
		case 68:
		this.PressedKeys.RIGHT = true;
		break;
		case 65:
		this.PressedKeys.LEFT = true;
		break;
		case 38:
		this.PressedKeys.UP = true;
		break;
		case 40:
		this.PressedKeys.DOWN = true;
		break;
		case 39:
		this.PressedKeys.ROTATE_RIGHT = true;
		break;
		case 37:
		this.PressedKeys.ROTATE_LEFT = true;
		break;
	}
};

AppScene.prototype._OnKeyUp = function (e) {
	switch(e.keyCode)
	{
		case 87:
		this.PressedKeys.FORWARD = false;
		break;
		case 83:
		this.PressedKeys.BACK = false;
		break;
		case 68:
		this.PressedKeys.RIGHT = false;
		break;
		case 65:
		this.PressedKeys.LEFT = false;
		break;
		case 38:
		this.PressedKeys.UP = false;
		break;
		case 40:
		this.PressedKeys.DOWN = false;
		break;
		case 39:
		this.PressedKeys.ROTATE_RIGHT = false;
		break;
		case 37:
		this.PressedKeys.ROTATE_LEFT = false;
		break;
	}
};

AppScene.prototype._TouchStartForward = function (e)
{
	e.preventDefault();
	this.PressedKeys.FORWARD = true;
	return false;
}
AppScene.prototype._TouchEndForward = function (e)
{
	e.preventDefault();
	this.PressedKeys.FORWARD = false;
	return false;
}

AppScene.prototype._TouchStartBack = function (e)
{
	e.preventDefault();
	this.PressedKeys.BACK = true;
	return false;
}
AppScene.prototype._TouchEndBack = function (e)
{
	e.preventDefault();
	this.PressedKeys.BACK = false;
	return false;
}

AppScene.prototype._TouchStartRight = function (e)
{
	e.preventDefault();
	this.PressedKeys.RIGHT = true;
	return false;
}
AppScene.prototype._TouchEndRight = function (e)
{
	e.preventDefault();
	this.PressedKeys.RIGHT = false;
	return false;
}

AppScene.prototype._TouchStartLeft = function (e)
{
	e.preventDefault();
	this.PressedKeys.LEFT = true;
	return false;
}
AppScene.prototype._TouchEndLeft = function (e)
{
	e.preventDefault();
	this.PressedKeys.LEFT = false;
	return false;
}

AppScene.prototype._TouchStartRleft = function (e)
{
	e.preventDefault();
	this.PressedKeys.ROTATE_LEFT = true;
	return false;
}
AppScene.prototype._TouchEndRleft = function (e)
{
	e.preventDefault();
	this.PressedKeys.ROTATE_LEFT = false;
	return false;
}

AppScene.prototype._TouchStartRright = function (e)
{
	e.preventDefault();
	this.PressedKeys.ROTATE_RIGHT = true;
	return false;
}
AppScene.prototype._TouchEndRright = function (e)
{
	e.preventDefault();
	this.PressedKeys.ROTATE_RIGHT = false;
	return false;
}
