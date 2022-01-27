(function () {
    const vertexPlane = `#version 300 es  
        void main()
        {
            float x = float((gl_VertexID & 1) << 2);
            float y = float((gl_VertexID & 2) << 1);
            gl_Position = vec4(x - 1.0, y - 1.0, 0, 1);
        }
`;

    const commonInclude = `#version 300 es
        precision highp float;
        vec3 rgb(float r, float g, float b) {
            return vec3(r / 255.0, g / 255.0, b / 255.0);
        }
        //-------------------------------------------------
        
        // Gaussian Blur functions
        
        const float kernel[21] = float[]
        (
            0.041555,
            0.041348, 0.040733, 0.039728, 0.038363, 0.036676,
            0.034715, 0.032532, 0.030183, 0.027726, 0.025215,
            0.022704, 0.020239, 0.017863, 0.015609, 0.013504,
            0.011566, 0.009808, 0.008235, 0.006845, 0.005633
        );
        
        vec3 gaussianBlur(sampler2D tex, vec2 fragCoord, vec3 iResolution, vec2 axis)
        {
            const float scale = 2.0;
            float offsetV = 1.0 / iResolution.x * scale;
            vec2 uv = fragCoord / iResolution.xy;
            // Convolution
            vec3 blurV = texture(tex, uv).rgb * kernel[0];
            for (int i = 1; i < 21; ++i) {
                blurV += texture(tex, uv - axis.xy * (float(i) * offsetV)).rgb * kernel[i];
                blurV += texture(tex, uv + axis.xy * (float(i) * offsetV)).rgb * kernel[i];
            }
            
            return blurV;
        }
`;

    const fragA = `
        uniform float iTime;
        uniform vec3 iResolution;
        uniform int iFrame;
        layout(location = 0) out vec4 fragColor;
        
        float outsideBar(float bWidth, float bY, float y)
        {
            float result = step(bY - bWidth, y) + step(y, bY + bWidth);
            result = clamp(step(2.0, result), 0.0, 1.0);
            result = 1.0 - result;
            return result;
        }

        vec4 drawSun(float rad, vec2 pos, vec2 uv)
        {
            vec4 result = vec4(0.0,0.0,0.0,0.0);
            
            const float horizonHeight = 0.07;
            float dist = length(pos - uv) - rad;
            float y = smoothstep(pos.y-rad, pos.y+rad, uv.y);
            float t = clamp(dist, 0.0, 1.0);
            
            vec3 topColor = rgb(251.0, 237.0, 32.0);
            vec3 midColor = rgb(254.0, 80.0, 52.0);
            vec3 bottomColor = rgb(254.0, 23.0, 105.0);

            result.a = 1.0 - t;
            result.a *= step(horizonHeight, y);

            if (y < 0.5)
              result.rgb = mix(bottomColor, midColor, y * 2.0);
            else 
              result.rgb = mix(midColor, topColor, y * 2.0 - 1.0);

            const float bStart = 0.80;
            const float bMaxWidth = 0.035;
            const float bSpeed = 0.0002;
            
            for (float i = 0.0; i < 7.0; i += 1.0)
            {
                float bWidth = mod(float(iFrame)*bSpeed, bMaxWidth);
                bWidth = mod(bWidth + (i), bMaxWidth) + 1.0/iResolution.y;
                float bWidthRatio = bWidth / bMaxWidth;
                float bY = bStart * (1.0 - bWidthRatio);
                
                result.a *= outsideBar(bWidth, bY, y);
            }
            
            return result;
        }


        void main()
        {
            vec2 uv = gl_FragCoord.xy;
            float maxRadius = min(iResolution.x, iResolution.y) * 0.5;
            float radius = maxRadius * 0.75;
            vec2 center = iResolution.xy * 0.5;
            vec4 clear = vec4(0.0,0.0,0.0,0.0);
            vec4 sun = drawSun(radius, center, uv);

            fragColor = mix(clear, sun, sun.a);
        }
`;


    const fragB = `
        uniform vec3 iResolution;
        uniform sampler2D iChannel0;
        layout(location = 0) out vec4 fragColor;
        void main()
        {
            fragColor.rgb = gaussianBlur( iChannel0, gl_FragCoord.xy, iResolution, vec2(1.,0.) );
            fragColor.a = 1.0;
        }
`;

    const fragImage = `
        uniform float iTime;
        uniform vec3 iResolution;
        uniform sampler2D iChannel0;
        uniform sampler2D iChannel1;
        layout(location = 0) out vec4 fragColor;
        void main()
        {              
            vec2 uv = gl_FragCoord.xy/iResolution.xy;

            fragColor.r  = texture( iChannel0, vec2(0.965, 0.995) * uv ).r;
            fragColor.ga = texture( iChannel0, uv ).ga;
            fragColor.b  = texture( iChannel0, vec2(1.02, 1.010) * uv ).b;
            
            vec3 bgColor = rgb(25.,18.,49.);
            //vec3 bgColor = rgb(10.,10.,10.);
            fragColor.rgb = mix(bgColor, fragColor.rgb, fragColor.a);
            
            vec3 blur = gaussianBlur( iChannel1, gl_FragCoord.xy, iResolution, vec2(0.,1.) );
            vec3 blurColor = rgb(250.0, 10.0, 160.0);
            vec3 grayscale = vec3(0.3,0.59,0.11);
            float blurAlpha = dot(blur, grayscale);
            
            fragColor.rgb = mix(
                fragColor.rgb + blurColor * blurAlpha * 1.33, 
                fragColor.rgb, 
                fragColor.a);
            fragColor.a = 1.0;
        }
`;

    function compileShader(ctx, shaderSource, shaderType) {
        var shader = ctx.createShader(shaderType);
        ctx.shaderSource(shader, shaderSource);
        ctx.compileShader(shader);
        var success = ctx.getShaderParameter(shader, ctx.COMPILE_STATUS);
        if (!success) {
            throw "could not compile shader:" + ctx.getShaderInfoLog(shader);
        }
        return shader;
    }

    function createProgram(ctx, vertexShaderText, fragmentShaderText) {
        var program = ctx.createProgram();
        var vertexShader = compileShader(ctx, vertexShaderText, ctx.VERTEX_SHADER);
        var fragmentShader = compileShader(ctx, fragmentShaderText, ctx.FRAGMENT_SHADER);
        ctx.attachShader(program, vertexShader);
        ctx.attachShader(program, fragmentShader);
        ctx.linkProgram(program);
        var success = ctx.getProgramParameter(program, ctx.LINK_STATUS);
        if (!success) {
            throw ("program filed to link:" + ctx.getProgramInfoLog(program));
        }
        return program;
    };

    function createTexture(ctx, w, h) {
        var texture = ctx.createTexture();
        ctx.bindTexture(ctx.TEXTURE_2D, texture);
        ctx.texImage2D(ctx.TEXTURE_2D, 0, ctx.RGBA, w, h,
            0, ctx.RGBA, ctx.UNSIGNED_BYTE, null);
        ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MIN_FILTER, ctx.LINEAR);
        ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_S, ctx.CLAMP_TO_EDGE);
        ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_T, ctx.CLAMP_TO_EDGE);
        ctx.bindTexture(ctx.TEXTURE_2D, null);
        return texture;
    }

    function resize(canvas) {
        var cssToRealPixels = 1; // bug: can't use window.devicePixelRatio here
        var displayWidth = Math.floor(canvas.clientWidth * cssToRealPixels);
        var displayHeight = Math.floor(canvas.clientHeight * cssToRealPixels);

        var resized = (canvas.width !== displayWidth || canvas.height !== displayHeight);
        if (resized) {
            canvas.width = displayWidth;
            canvas.height = displayHeight;
        }
        return resized;
    }

    var gl = null;
    var canvas = null;
    var frame = 0;
    var vertexArray = null;
    var framebufferA = null;
    var textureA = null;
    var framebufferB = null;
    var textureB = null;
    var bufferAProgram = null;
    var bufferBProgram = null;
    var imageProgram = null;
    var requestId = 0;
    var previous_time = 0;
    const frameRate = 16; // 1s / 60Hz = 16ms

    canvas = document.getElementById('sun');
    canvas.addEventListener("webglcontextlost", handleContextLost, false);
    canvas.addEventListener("webglcontextrestored", handleContextRestored, false);
    gl = canvas.getContext('webgl2', {
        antialias: true
    }) || canvas.getContext('experimental-webgl2', {
        antialias: true
    });
    init();

    function init() {
        if (gl === null)
            return;

        // dummy vertex array
        vertexArray = gl.createVertexArray();
        gl.bindVertexArray(vertexArray);
        gl.bindVertexArray(null);

        bufferAProgram = createProgram(gl, vertexPlane, commonInclude + fragA);
        bufferBProgram = createProgram(gl, vertexPlane, commonInclude + fragB);
        imageProgram = createProgram(gl, vertexPlane, commonInclude + fragImage);

        framebufferA = gl.createFramebuffer();
        framebufferB = gl.createFramebuffer();

        textureA = createTexture(gl, gl.canvas.width, gl.canvas.height);
        textureB = createTexture(gl, gl.canvas.width, gl.canvas.height);

        previous_time = Date.now() - frameRate; // force render
        requestId = requestAnimationFrame(animate);
    }

    function animate() {
        var now = Date.now();
        var elapsed_time = now - previous_time;
        if (elapsed_time >= frameRate) {
            draw(now);
            previous_time = Date.now();
        }
        requestId = requestAnimationFrame(animate);
    }

    function draw(time) {
        frame = (frame + 1);
        time *= 0.001;

        if (resize(gl.canvas)) {
            if (gl.canvas.width <= 0 || gl.canvas.width <= 0)
                return;

            gl.deleteTexture(textureA);
            gl.deleteTexture(textureB);
            textureA = createTexture(gl, gl.canvas.width, gl.canvas.height);
            textureB = createTexture(gl, gl.canvas.width, gl.canvas.height);
        }

        // Buffer A
        {
            gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, framebufferA);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, textureA, 0);

            gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
            gl.clearColor(0, 0, 0, 0);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

            gl.useProgram(bufferAProgram);
            gl.uniform1f(gl.getUniformLocation(bufferAProgram, "iTime"), time);
            gl.uniform1i(gl.getUniformLocation(bufferAProgram, "iFrame"), frame);
            gl.uniform3f(gl.getUniformLocation(bufferAProgram, "iResolution"), gl.canvas.width, gl.canvas
                .height, 1.0);

            gl.bindVertexArray(vertexArray);

            gl.drawArrays(gl.TRIANGLES, 0, 6);
        }

        // Buffer B
        {
            gl.bindFramebuffer(gl.FRAMEBUFFER, framebufferB);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, textureB, 0);

            gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
            gl.clearColor(0, 0, 0, 0);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

            gl.useProgram(bufferBProgram);
            gl.uniform3f(gl.getUniformLocation(bufferBProgram, "iResolution"), gl.canvas.width, gl.canvas
                .height, 1.0);

            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, textureA);
            gl.uniform1i(gl.getUniformLocation(bufferBProgram, "iChannel0"), 0);

            gl.bindVertexArray(vertexArray);

            gl.drawArrays(gl.TRIANGLES, 0, 6);
        }

        // Image
        {
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);

            gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
            gl.clearColor(0, 0, 0, 0);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

            gl.useProgram(imageProgram);
            gl.uniform1f(gl.getUniformLocation(imageProgram, "iTime"), time);
            gl.uniform3f(gl.getUniformLocation(imageProgram, "iResolution"), gl.canvas.width, gl.canvas.height,
                1.0);

            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, textureA);
            gl.uniform1i(gl.getUniformLocation(imageProgram, "iChannel0"), 0);
            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_2D, textureB);
            gl.uniform1i(gl.getUniformLocation(imageProgram, "iChannel1"), 1);

            gl.bindVertexArray(vertexArray);

            gl.drawArrays(gl.TRIANGLES, 0, 6);
        }
    }

    function handleContextLost(event) {
        event.preventDefault();
        cancelRequestAnimationFrame(requestId);
    }

    function handleContextRestored(event) {
        init();
    }

})();
