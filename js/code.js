"use strict";

import * as cg from "./cg.js";
import * as m4 from "./glmjs/mat4.js";
import * as twgl from "./twgl-full.module.js";
import * as v3 from "./glmjs/vec3.js";
import * as v4 from "./glmjs/vec4.js";

async function main() {
  const lightIntensity = document.querySelector("#lightIntensity");
  const textLightIntensity = document.querySelector("#textLightIntensity");
  const ambientColorRed = document.querySelector("#ambientColorRed");
  const ambientColorGreen = document.querySelector("#ambientColorGreen");
  const ambientColorBlue = document.querySelector("#ambientColorBlue");
  const posXdiffuse = document.querySelector("#posX");
  const posYdiffuse = document.querySelector("#posY");
  const posZdiffuse = document.querySelector("#posZ");
  const textPosX = document.querySelector("#textPosX");
  const textPosY = document.querySelector("#textPosY");
  const textPosZ = document.querySelector("#textPosZ");
  const diffuseColorRed = document.querySelector("#diffuseColorRed");
  const diffuseColorGreen = document.querySelector("#diffuseColorGreen");
  const diffuseColorBlue = document.querySelector("#diffuseColorBlue");
  const lsColorRed = document.querySelector("#lsColorRed");
  const lsColorGreen = document.querySelector("#lsColorGreen");
  const lsColorBlue = document.querySelector("#lsColorBlue");
  const lanternColorRed = document.querySelector("#lanternColorRed");
  const lanternColorGreen = document.querySelector("#lanternColorGreen");
  const lanternColorBlue = document.querySelector("#lanternColorBlue");
  const posXls = document.querySelector("#posXls");
  const textPosXls = document.querySelector("#textPosXls");

  const gl = document.querySelector("#canvitas").getContext("webgl2");
  if (!gl) return undefined !== console.log("WebGL 2.0 not supported");

  twgl.setDefaults({ attribPrefix: "a_" });

  const vertSrc = await fetch("glsl/vertexSrc.vert").then((r) => r.text());
  const fragSrc = await fetch("glsl/fragmentSrc.frag").then((r) => r.text());
  const meshProgramInfo = twgl.createProgramInfo(gl, [vertSrc, fragSrc]);
  const cubex1 = await cg.loadObj("models/crate/crate.obj", gl, meshProgramInfo);
  const planet1 = await cg.loadObj("models/planet/planet.obj", gl, meshProgramInfo);

  const vertLanternSrc = await fetch("glsl/lanternVertexSrc.vert").then((r) => r.text());
  const fragLanternSrc = await fetch("glsl/lanternFragSrc.frag").then((r) => r.text());
  const lanternProgramInfo = twgl.createProgramInfo(gl, [vertLanternSrc, fragLanternSrc]);
  const cubex2 = await cg.loadObj("models/crate/crate.obj", gl, lanternProgramInfo);
  const planet2 = await cg.loadObj("models/planet/planet.obj", gl, lanternProgramInfo);

  const vertSrcLS = await fetch("glsl/ls.vert").then((r) => r.text());
  const fragSrcLS = await fetch("glsl/ls.frag").then((r) => r.text());
  const lsProgramInfo = twgl.createProgramInfo(gl, [vertSrcLS, fragSrcLS]);
  const lightSource = await cg.loadObj("models/planet/planet.obj", gl, lsProgramInfo);

  let autorotate = false;
  let deltaTime = 0;
  let lastTime = 0;
  let aspect = 16.0 / 9.0;
  let theta = 0.0;

  const cam = new cg.Cam([2, 0, 15], 25);
  const temp = v3.create();
  const one = v3.fromValues(1, 1, 1);
  const initial_light_pos = v3.fromValues(0.0, 0, 0);
  const origin = v4.create();
  const light_position = v3.create();

  const positionCrate = new Float32Array([0, 0, 0]);
  const positionPlanet = new Float32Array([10, 0, -2]);
  const lsPosition = new Float32Array([10.0, 0.0, 4]);
  const lsVision = new Float32Array([0.0, 0.0, -0.5]);
  const rotationAxis = new Float32Array([0, 1, 0]);

  const uniforms = {
    u_world: m4.create(),
    u_projection: m4.create(),
    u_view: cam.viewM4,
  };

  const fragUniforms = {
    u_ambientStrength: new Float32Array([1.0, 1.0, 1.0]),
    u_lightColorAmbient: new Float32Array([1.0, 1.0, 1.0]),
    u_diffuseVec: new Float32Array([0.0, 0.0, 0.0]),
    u_lightColorDiffuse: new Float32Array([1.0, 1.0, 1.0]),
    u_viewPosition: cam.pos,
    "u_light.cutOff": Math.cos(Math.PI / 30.0),
    "u_light.direction": cam.lookAt,
    "u_light.position": cam.pos,
    u_lightColorLantern: new Float32Array([1.0, 1.0, 1.0]),
    "u_light.outerCutOff": Math.cos(Math.PI / 24),
    "u_light.constant": 1.0,
    "u_light.linear": 0.09,
    "u_light.quadratic": 0.032,
  };

  const lsFragColor = {
    u_lightColor: new Float32Array([1.0, 1.0, 1.0]),
  };

  const lsfragUniforms = {
    u_ambientStrength: fragUniforms.u_ambientStrength,
    u_lightColorAmbient: fragUniforms.u_lightColorAmbient,
    u_diffuseVec: fragUniforms.u_lightColorDiffuse,
    u_lightColorDiffuse: fragUniforms.u_lightColorDiffuse,
    u_viewPosition: cam.pos,
    "u_light.cutOff": Math.cos(Math.PI / 15.0),
    "u_light.direction": lsVision,
    "u_light.position": lsPosition,
    u_lightColorLantern: lsFragColor.u_lightColor,
    "u_light.outerCutOff": Math.cos(Math.PI / 12),
    "u_light.constant": 1.0,
    "u_light.linear": 0.09,
    "u_light.quadratic": 0.032,
  };

  lightIntensity.oninput = () => {
    const value = lightIntensity.value;
    fragUniforms.u_ambientStrength[0] = value / 100.0;
    fragUniforms.u_ambientStrength[1] = value / 100.0;
    fragUniforms.u_ambientStrength[2] = value / 100.0;
    textLightIntensity.innerHTML = value + "%";
  };

  ambientColorRed.oninput = () => {
    const value = ambientColorRed.value;
    fragUniforms.u_lightColorAmbient[0] = value / 100.0;
  };

  ambientColorGreen.oninput = () => {
    const value = ambientColorGreen.value;
    fragUniforms.u_lightColorAmbient[1] = value / 100.0;
  };

  ambientColorBlue.oninput = () => {
    const value = ambientColorBlue.value;
    fragUniforms.u_lightColorAmbient[2] = value / 100.0;
  };

  posXdiffuse.oninput = () => {
    const value = posXdiffuse.value;
    fragUniforms.u_diffuseVec[0] = value;
    textPosX.innerHTML = "X " + value;
  };

  posYdiffuse.oninput = () => {
    const value = posYdiffuse.value;
    fragUniforms.u_diffuseVec[1] = value;
    textPosY.innerHTML = "Y " + value;
  };

  posZdiffuse.oninput = () => {
    const value = posZdiffuse.value;
    fragUniforms.u_diffuseVec[2] = value;
    textPosZ.innerHTML = "Z " + value;
  };

  diffuseColorRed.oninput = () => {
    const value = diffuseColorRed.value;
    fragUniforms.u_lightColorDiffuse[0] = value / 100.0;
  };

  diffuseColorGreen.oninput = () => {
    const value = diffuseColorGreen.value;
    fragUniforms.u_lightColorDiffuse[1] = value / 100.0;
  };

  diffuseColorBlue.oninput = () => {
    const value = diffuseColorBlue.value;
    fragUniforms.u_lightColorDiffuse[2] = value / 100.0;
  };

  lanternColorRed.oninput = () => {
    const value = lanternColorRed.value;
    fragUniforms.u_lightColorLantern[0] = value / 100.0;
  };

  lanternColorGreen.oninput = () => {
    const value = lanternColorGreen.value;
    fragUniforms.u_lightColorLantern[1] = value / 100.0;
  };

  lanternColorBlue.oninput = () => {
    const value = lanternColorBlue.value;
    fragUniforms.u_lightColorLantern[2] = value / 100.0;
  };

  lsColorRed.oninput = () => {
    const value = lsColorRed.value;
    lsFragColor.u_lightColor[0] = value / 100.0;
  };

  lsColorGreen.oninput = () => {
    const value = lsColorGreen.value;
    lsFragColor.u_lightColor[1] = value / 100.0;
  };

  lsColorBlue.oninput = () => {
    const value = lsColorBlue.value;
    lsFragColor.u_lightColor[2] = value / 100.0;
  };

  posXls.oninput = () => {
    const value = posXls.value;
    lsPosition[0] = value;
    textPosXls.innerHTML = "X " + value;
  };

  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.CULL_FACE);

  function render(elapsedTime) {
    elapsedTime *= 1e-3;
    deltaTime = elapsedTime - lastTime;
    lastTime = elapsedTime;

    if (twgl.resizeCanvasToDisplaySize(gl.canvas)) {
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
      aspect = gl.canvas.width / gl.canvas.height;
    }

    gl.clearColor(0.1, 0.1, 0.1, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    if (autorotate) theta += deltaTime;

    m4.identity(uniforms.u_world);
    m4.rotate(uniforms.u_world, uniforms.u_world, theta, rotationAxis);
    m4.translate(uniforms.u_world, uniforms.u_world, initial_light_pos);
    v3.transformMat4(light_position, origin, uniforms.u_world);

    m4.identity(uniforms.u_projection);
    m4.perspective(uniforms.u_projection, cam.zoom, aspect, 0.1, 100);

    if (document.getElementById("state1").checked) {
      //crate
      gl.useProgram(meshProgramInfo.program);
      twgl.setUniforms(meshProgramInfo, fragUniforms);
      m4.identity(uniforms.u_world);
      m4.scale(uniforms.u_world, uniforms.u_world, v3.scale(temp, one, 1));
      m4.translate(uniforms.u_world, uniforms.u_world, positionCrate);
      m4.rotate(uniforms.u_world, uniforms.u_world, theta, rotationAxis);
      twgl.setUniforms(meshProgramInfo, uniforms);

      for (const { bufferInfo, vao, material } of cubex1) {
        gl.bindVertexArray(vao);
        twgl.setUniforms(meshProgramInfo, {}, material);
        twgl.drawBufferInfo(gl, bufferInfo);
      }
      //planet
      gl.useProgram(meshProgramInfo.program);
      twgl.setUniforms(meshProgramInfo, fragUniforms);
      m4.identity(uniforms.u_world);
      m4.scale(uniforms.u_world, uniforms.u_world, v3.scale(temp, one, 1));
      m4.translate(uniforms.u_world, uniforms.u_world, positionPlanet);
      m4.rotate(uniforms.u_world, uniforms.u_world, theta, rotationAxis);
      twgl.setUniforms(meshProgramInfo, uniforms);

      for (const { bufferInfo, vao, material } of planet1) {
        gl.bindVertexArray(vao);
        twgl.setUniforms(meshProgramInfo, {}, material);
        twgl.drawBufferInfo(gl, bufferInfo);
      }
    }

    if (document.getElementById("state2").checked) {
      //crate
      gl.useProgram(lanternProgramInfo.program);
      twgl.setUniforms(lanternProgramInfo, fragUniforms);
      m4.identity(uniforms.u_world);
      m4.scale(uniforms.u_world, uniforms.u_world, v3.scale(temp, one, 1));
      m4.translate(uniforms.u_world, uniforms.u_world, positionCrate);
      m4.rotate(uniforms.u_world, uniforms.u_world, theta, rotationAxis);
      twgl.setUniforms(lanternProgramInfo, uniforms);
      for (const { bufferInfo, vao, material } of cubex2) {
        gl.bindVertexArray(vao);
        twgl.setUniforms(lanternProgramInfo, {}, material);
        twgl.drawBufferInfo(gl, bufferInfo);
      }
      //planet
      gl.useProgram(lanternProgramInfo.program);
      twgl.setUniforms(lanternProgramInfo, fragUniforms);
      m4.identity(uniforms.u_world);
      m4.scale(uniforms.u_world, uniforms.u_world, v3.scale(temp, one, 0.75));
      m4.translate(uniforms.u_world, uniforms.u_world, positionPlanet);
      m4.rotate(uniforms.u_world, uniforms.u_world, theta, rotationAxis);
      twgl.setUniforms(lanternProgramInfo, uniforms);
      for (const { bufferInfo, vao, material } of planet2) {
        gl.bindVertexArray(vao);
        twgl.setUniforms(lanternProgramInfo, {}, material);
        twgl.drawBufferInfo(gl, bufferInfo);
      }
    }

    if (document.getElementById("state3").checked) {
      //crate
      gl.useProgram(lanternProgramInfo.program);
      twgl.setUniforms(lanternProgramInfo, lsfragUniforms);
      m4.identity(uniforms.u_world);
      m4.scale(uniforms.u_world, uniforms.u_world, v3.scale(temp, one, 1));
      m4.translate(uniforms.u_world, uniforms.u_world, positionCrate);
      m4.rotate(uniforms.u_world, uniforms.u_world, theta, rotationAxis);
      twgl.setUniforms(lanternProgramInfo, uniforms);
      for (const { bufferInfo, vao, material } of cubex2) {
        gl.bindVertexArray(vao);
        twgl.setUniforms(lanternProgramInfo, {}, material);
        twgl.drawBufferInfo(gl, bufferInfo);
      }
      //planet
      gl.useProgram(lanternProgramInfo.program);
      twgl.setUniforms(lanternProgramInfo, lsfragUniforms);
      m4.identity(uniforms.u_world);
      m4.scale(uniforms.u_world, uniforms.u_world, v3.scale(temp, one, 0.75));
      m4.translate(uniforms.u_world, uniforms.u_world, positionPlanet);
      m4.rotate(uniforms.u_world, uniforms.u_world, theta, rotationAxis);
      twgl.setUniforms(lanternProgramInfo, uniforms);
      for (const { bufferInfo, vao, material } of planet2) {
        gl.bindVertexArray(vao);
        twgl.setUniforms(lanternProgramInfo, {}, material);
        twgl.drawBufferInfo(gl, bufferInfo);
      }
      //light source
      gl.useProgram(lsProgramInfo.program);
      m4.identity(uniforms.u_world);
      m4.translate(uniforms.u_world, uniforms.u_world, lsPosition);
      m4.scale(uniforms.u_world, uniforms.u_world, v3.scale(temp, one, 0.075));
      twgl.setUniforms(lsProgramInfo, uniforms);
      twgl.setUniforms(lsProgramInfo, lsFragColor);
      for (const { bufferInfo, vao, material } of lightSource) {
        gl.bindVertexArray(vao);
        twgl.setUniforms(lsProgramInfo, {}, material);
        twgl.drawBufferInfo(gl, bufferInfo);
      }
    }

    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);

  document.addEventListener("keydown", (e) => {
    /**/ if (e.key === "w") cam.processKeyboard(cg.FORWARD, deltaTime);
    else if (e.key === "a") cam.processKeyboard(cg.LEFT, deltaTime);
    else if (e.key === "s") cam.processKeyboard(cg.BACKWARD, deltaTime);
    else if (e.key === "d") cam.processKeyboard(cg.RIGHT, deltaTime);
    else if (e.key === "r") autorotate = !autorotate;
  });
  document.addEventListener("mousemove", (e) => cam.movePov(e.x, e.y));
  document.addEventListener("mousedown", (e) => cam.startMove(e.x, e.y));
  document.addEventListener("mouseup", () => cam.stopMove());
  document.addEventListener("wheel", (e) => cam.processScroll(e.deltaY));
}

main();
