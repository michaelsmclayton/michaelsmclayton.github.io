import React, { Component } from 'react';
import Matter from 'matter-js';
window.decomp = require('poly-decomp');

class BouncingBallsLogo extends Component {
  /////////////////////////////////////////////////////
  // CONSTRUCTOR
  /////////////////////////////////////////////////////
  constructor(props) {
    super(props);

    // Global properties
    this.fontColour = this.props.textColour;
    this.fontSize = "4.5px";
    this.height = .7*window.innerHeight;
    this.width = this.height*.8;

    // Circle properties
    this.circleProperties = {
      size: .015*this.height,
      startingVelocity: {x: 0, y: -Math.random()*50},
      startingAcceleration: {x: 0.5, y: 0},
      renderProperties: {
        restitution: .5,
        friction: 0,
        render: {
          fillStyle: this.fontColour,
          strokeStyle: 'transparent',
          opacity: 0
        }
      }
    }

    // Barrier properties
    this.barrierProperties = {
      fillStyle: this.fontColour,
      strokeStyle: this.fontColour,
      lineWidth: 1,
      opacity: 1
    }

    this.textProperties = {
      fontFamily: "Helvetica",
      fontSize: .04*this.height,
      color: this.fontColour,
    }
  }

  componentDidMount(){
    this.setup();
    this.plotSVGs();
    this.run();
  }

  /////////////////////////////////////////////////////
  // SETUP
  /////////////////////////////////////////////////////

  setup = () => {
    // Extract fundamental components of MatterJS
    this.Engine = Matter.Engine;
    this.Render = Matter.Render;
    this.MouseConstraint = Matter.MouseConstraint;
    this.Mouse = Matter.Mouse;
    this.World = Matter.World,
    this.Bodies = Matter.Bodies//,
    this.Composite = Matter.Composite;
    //Body = Matter.Body;
    // Runner = Matter.Runner,

    // Create the engine
    this.engine = this.Engine.create();
    this.engine.world.gravity.y = 0.25;
    this.world = this.engine.world;

    // Create the renderer
    let render = this.Render.create({
        element: document.getElementById("matterJSElement"),
        engine: this.engine,
        options: {
          width: this.width,
          height: this.height,
          pixelRatio: 'auto',
          background: "transparent", // this.props.backgroundColor,
          wireframes: false, // Allows the objects to be coloured
        }
    });
    this.Render.run(render);

    // Add mouse control
    var mouse = this.Mouse.create(render.canvas),
        mouseConstraint = this.MouseConstraint.create(this.engine, {
            mouse: mouse,
            constraint: {
                stiffness: 0.2,
                render: {
                    visible: false
                }
            }
        });
    this.World.add(this.world, mouseConstraint);

    // // keep the mouse in sync with rendering
    // render.mouse = mouse;

    // // fit the render viewport to the scene
    // Render.lookAt(render, {
    //     min: { x: 0, y: 0 },
    //     max: { x: 800, y: 600 }
    // });
    //this.run(Engine);

  }

  /////////////////////////////////////////////////////
  // RUN
  /////////////////////////////////////////////////////

  run = () => {
    window.requestAnimationFrame(this.run);
    this.checkAndUpdate();
    if (Math.random()<0.05){
      this.createNewObject();
    }
    this.Engine.update(this.engine, 1000/60);
  }

  checkAndUpdate = () => {
    this.world.bodies.forEach((body)=>{
      if (body.label=="Circle Body") { // Only for circle objects
        this.updateObjectAlpha(body);
        this.removeDeadObjects(body);
      }
    })
  }

  createNewObject = () => {
    let xPosition = this.width*.4 + (Math.random()*this.width*.25),
      yPosition = this.height*.025,
      body = this.Bodies.circle(xPosition, yPosition, this.circleProperties.size, this.circleProperties.renderProperties);
      this.World.add(this.world, body);
  }

  updateObjectAlpha = (body) => {
    let alpha; // Initialise alpha
    let position = body.position; // Get the body's position
    let distanceFromXCenter = Math.abs(position.x-this.width/2),
      distanceFromYCenter = Math.abs(position.y-this.height/2),
      xAlpha = Math.abs(distanceFromXCenter/(this.width/2) - 1),
      yAlpha = Math.abs(distanceFromYCenter/(this.height/2) - 1);
    if (xAlpha<yAlpha){
      alpha = xAlpha;
    } else {
      alpha = yAlpha
    }
    body.render.opacity = alpha;
  }

  removeDeadObjects = (body) => {
    // Remove if lower than height
    if (body.position.y > this.height){
      this.Composite.remove(this.world, body)
    }    
  }

  ////////////////////////////////////////////////////////////////////////
  // SVG FUNCTIONS
  ////////////////////////////////////////////////////////////////////////

  plotSVGs = () => {
    // Get SVG paths
    let combinedPaths = [];
    combinedPaths.push(this.getSVGPositions(document.getElementById("leftM")));
    combinedPaths.push(this.getSVGPositions(document.getElementById("rightM")));

    // Find min/max x and y for all svg paths
    const minAndMax = this.findMinAndMax(combinedPaths);

    // Scale all of the svg paths
    const xSize = 0.6; const ySize = .8; // WHY 2!!?
    const scaleWidth = xSize * this.width;
    const scaleHeight = ySize * this.height;
    for (let pathIndex in combinedPaths){
      for (let i=0; i<combinedPaths[pathIndex].length; i++){
        combinedPaths[pathIndex][i].x = this.scaleSVGCoordinates(combinedPaths[pathIndex][i].x, minAndMax.xHigh, scaleWidth);
        combinedPaths[pathIndex][i].y = this.scaleSVGCoordinates(combinedPaths[pathIndex][i].y, minAndMax.yHigh, scaleHeight);
      }
    }

    // Add Cs
    combinedPaths.push(this.drawC(.72*(Math.PI*2), .73*(Math.PI*2), .26*(Math.PI*2), .28*(Math.PI*2)))
    combinedPaths.push(this.drawC(.22*(Math.PI*2), .21*(Math.PI*2), .05*(Math.PI*2), .05*(Math.PI*2)))

    // Create SVGs
    this.createSVG(combinedPaths)
  }

  getSVGPositions = (svgPath) => { // Sizes taken in percent
    const pathLength = Math.floor( svgPath.getTotalLength() );
    const svgResolution = 500;
    const iIncrement = 1/svgResolution;
    let svgPathCoordinates = [];
    for (let prcnt=0; prcnt<1; prcnt+=iIncrement){
      let currentPoint = prcnt*pathLength;
      let pt = svgPath.getPointAtLength(currentPoint);
      pt.x = pt.x;
      pt.y = pt.y;
      svgPathCoordinates.push(pt);
    }
    return svgPathCoordinates
  }

  findMinAndMax = (svgPaths) => {
    // Function to get lowest and highest dimensions of SVG
    function getLowHighValues(path, property){
      let low = 0, high = 0, currentValue;
      for (let i=0; i<path.length; i++){
        currentValue = path[i][property];
        if (currentValue > high) high = currentValue
        if (currentValue < low) low = currentValue
      }
      return {low, high}
    }

    // Loop over svg paths and update min/max dimensions
    let xHigh = 0;
    let yHigh = 0;
    let currentXDimensions, currentYDimensions;
    for (let path of svgPaths) {
      currentXDimensions = getLowHighValues(path, 'x');
      if (currentXDimensions.high>xHigh){xHigh = currentXDimensions.high}
      currentYDimensions = getLowHighValues(path, 'y');
      if (currentYDimensions.high>yHigh){yHigh = currentYDimensions.high}
    }
    return {xHigh, yHigh};
  }

  scaleSVGCoordinates(currentValue, high, newScale) {
    let currentPercent = currentValue / high;
    let newValue = currentPercent * newScale;
    return newValue;
  }

  drawC = (innerStartingTheta, outerEndTheta, innerEndTheta, outerStartingTheta) => {
    const height = .45*this.height;
    const numberOfPoints = 50; // 40;
    const svg = document.getElementById("svg");
    let surface = [];
  
    // Outer circle
    const outerRadius = height * 0.45;
    const outerIncrement = (outerEndTheta-outerStartingTheta)/numberOfPoints;
    for (let outerTheta = outerStartingTheta; outerTheta<outerEndTheta; outerTheta+=outerIncrement){
       let currentX = outerRadius*Math.cos(outerTheta);
       let currentY = outerRadius*Math.sin(outerTheta);
       let newSVGPoint = svg.createSVGPoint();
       newSVGPoint.x = currentX;
       newSVGPoint.y = currentY;
       surface.push(newSVGPoint);
    }
  
    // Inner circle
    const innerRadius = height * 0.3;
    const innerIncrement = (innerEndTheta-innerStartingTheta)/numberOfPoints;
    let innerTheta = innerStartingTheta
    for (let i=0;i<numberOfPoints;i++){
      let currentX = innerRadius*Math.cos(innerTheta);
      let currentY = innerRadius*Math.sin(innerTheta);
      let newSVGPoint = svg.createSVGPoint();
      newSVGPoint.x = currentX;
      newSVGPoint.y = currentY;
      surface.push(newSVGPoint);
      innerTheta += innerIncrement;
    }
  
    // Last connection
    let currentX = outerRadius*Math.cos(outerStartingTheta);
    let currentY = outerRadius*Math.sin(outerStartingTheta);
    let newSVGPoint = svg.createSVGPoint();
    newSVGPoint.x = currentX;
    newSVGPoint.y = currentY;
    surface.push(newSVGPoint);
  
    return surface;
  }

  createSVG = (svgPaths) => {
    let polygonObjects = [];
    const polygonPositions = [
      {width: .36*this.width, height: .19*this.height},
      {width: .66*this.width, height: .31*this.height}, // right M
      {width: .35*this.width, height: .56*this.height},
      {width: .65*this.width, height: .68*this.height},
    ];
    for (let pathIndex in svgPaths){
      polygonObjects.push(this.Bodies.fromVertices(polygonPositions[pathIndex].width, polygonPositions[pathIndex].height, svgPaths[pathIndex], { isStatic: true, render: this.barrierProperties}))
    }
    this.World.add(this.world, polygonObjects);
  }

  ////////////////////////////////////////////////////////////////////////
  // RENDER
  ////////////////////////////////////////////////////////////////////////

  menuBox = (text, width, padding) => {
    return (
      <div style={{paddingRight: padding}}>
        <center>
          <p style={{
            fontSize: .04*this.height,
            fontFamily: this.textProperties.fontFamily,
            color: this.props.backgroundColor,
            width: width,
            height: .04*this.height,
            borderRadius: "25px",
            backgroundColor: this.fontColour,
            verticalAlign: "middle",
            border: '1px solid'}}><b>{text}</b></p>
        </center>
      </div>
    )
  } 

  render() {
    return (
      <div id="matterJSElement" style={{display:'inline-flex', marginTop: 0, border: '0px solid'}}>
        <svg id="svg" style={{display: "none"}} height="190mm" width="130mm" version="1.1" viewBox="0 0 130 190">
          <g transform="translate(0,-47)">
            <path id="innerC" d="m45.716 234.61c-13.121 9.3252-17.499 25.225-11.878 39.551 5.6212 14.326 20.676 23 36.737 21.167 16.061-1.8334 29.141-13.719 31.919-29.004" fill="none" stroke="#000" strokeWidth=".2"/>
            <path id="outerC" d="m122.82 269.78c-4.5653 25.049-24.672 44.417-51.02 47.43-26.348 3.0131-51.04-11.194-60.253-34.667-9.2135-23.474-0.66201-50.389 20.867-65.677" fill="none" stroke="#000" strokeWidth=".2"/>
            <path id="leftM" d="m48.119 100.42 0.18899 54.996-20.411-0.18899 0.13364-88.657 20.078 0.11165 45.745 61.331-14.968 12.36-30.767-39.952" fill="none" stroke="#fff" strokeWidth="3.565"/>
            <path id="rightM" d="m117.67 170.31 0.26727 28.464 20.446-9.4881 0.13364-101.56-9.889-13.096-32.874 26.46 10.29 14.032 11.493-9.3544 0.13363 56.928-10.951 5.8299c1.6192 2.987 1.2722 2.3824 3.1619 5.642z" fill="none" stroke="#fff" strokeWidth="3.4"/>
		
		      </g>
        </svg>
        <div style={{position:"absolute", marginTop: .8*this.height, width: this.width, border:'0px solid'}}>
          <center>
            <p style={this.textProperties}><b>MICHAEL S. CLAYTON (PhD)</b></p>
            <p style={this.textProperties}><i>neuroscientist & programmer</i></p>
          </center>
        </div>
      </div>
    );
  }
}

export default BouncingBallsLogo;

// For no penis bit = <path id="rightM" d="m73.456 228.71 21.531-14.549 0.26727 28.464 20.446-9.4881 0.13364-101.56-9.889-13.096-32.874 26.46 10.29 14.032 11.493-9.3544 0.13363 70.928-24.909 17.152c-0.97956 0.56277-1.5619 1.6082-1.5144 2.7185 0.0475 1.1103 0.7172 2.1045 1.7414 2.5852s2.236 0.36954 3.151-0.28904" fill="none" stroke="#000" strokeWidth=".26458px"/>

// Correct = 
// <path id="rightM" d="m73.456 228.71 21.531-14.549 0.26727 28.464 20.446-9.4881 0.13364-101.56-9.889-13.096-32.874 26.46 10.29 14.032 11.493-9.3544 0.13363 56.928-24.909 17.152c-0.97956 0.56277-1.5619 1.6082-1.5144 2.7185 0.0475 1.1103 0.7172 2.1045 1.7414 2.5852s2.236 0.36954 3.151-0.28904" fill="none" stroke="#000" strokeWidth=".26458px"/>


/*
        <div style={{position:"absolute", marginTop: .75*this.height, width: this.width, border:'0px solid'}}>
          <center>
            <p style={this.textProperties}><b>MICHAEL S. CLAYTON</b></p>
            <p style={this.textProperties}><i>neuroscientist and programmer</i></p>
          </center>
          <div style={{display:"flex", alignItems:"center", justifyContent:"center"}}>
            <div style={{display:"inline-flex"}}>
              {this.menuBox('ABOUT', .25*this.width, .10*this.width)}
              {this.menuBox('CV', .25*this.width, 0)}
            </div>
          </div>
          <div style={{display:"flex", alignItems:"center", justifyContent:"center"}}>
            <div style={{display:"inline-flex", textAlign: "center"}}>
              {this.menuBox('RESEARCH', .35*this.width, .05*this.width)}
              {this.menuBox('JAVASCRIPT', .35*this.width, 0)}
            </div>
          </div>
        </div>
*/
