'use strict';
var App;
function Init()
{
	
	var canvas = document.getElementById('webgl-surface');	
	var gl = canvas.getContext('webgl');
	if(!gl)
	{
		console.log('failed to get webgl context, trying experimental-webgl');
		gl = canvas.getContext('experimental-webgl');
	}
	if(!gl)
	{
		console.log('your browser does not support webgl, try using different browser');
		return;
	}

	App = new AppScene(gl);
	App.loadApp(function (demoLoadError)
	{
		if (demoLoadError)
		{
			alert('Could not load the demo - see console for more details');
			console.error(demoLoadError);
		} 
		else 
		{
			App.startApp();
		}
	});
	
}




