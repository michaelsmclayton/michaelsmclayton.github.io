///////////////////////////////////////////////////////////////////
// Bouncing Logo
///////////////////////////////////////////////////////////////////

//////////////////////////////////////
// Initialisations
/////////////////////////////////////

var screenHeight = .7*window.innerHeight;
var screenWidth = .8*screenHeight;

var Engine = Matter.Engine, // module aliases
  Render = Matter.Render,
  World = Matter.World,
  Bodies = Matter.Bodies;
var engine, world;

// var circles = [];
// var boundaries = [];
// var ground;


/////////////////////////
// Display properties
/////////////////////////
const circleProperties = {
  size: .016*screenHeight,
  startingVelocity: {x: 0, y: -Math.random()*50},
  startingAcceleration: {x: 0.5, y: 0},
  renderProperties: {
    restitution: .5,
    friction: 0,
    render: {
      fillStyle: "#FFF",
      strokeStyle: 'transparent',
      opacity: 0
    }
  }
}
const barrierProperties = {
  fillStyle: "#FFF",
  strokeStyle: "#FFF",
  lineWidth: 1,
  opacity: 1
}

/////////////////////////
// Setup function
/////////////////////////
function setup() {
  createCanvas(0, 0);

  // Setup engine
  engine = Engine.create();
  world = engine.world;

  // Set gravity (based on screen height)
  let gravity = map(screenHeight, 400, 1200, 0.2, .75);
  engine.world.gravity.y = gravity;
  world = engine.world;

  // Create the renderer
  let render = Render.create({
    element: document.getElementById("matterJSElement"),
    engine: engine,
    options: {
      width: screenWidth,
      height: screenHeight,
      pixelRatio: 'auto',
      background: "transparent", // this.props.backgroundColor,
      wireframes: false, // Allows the objects to be coloured
    }
  });
  Render.run(render);

  // Add SVGs
  plotSVGs();

  // Add some balls to start
  for (let i=0; i<3;i++){
    createNewObject();
  }
}

/////////////////////////
// Running functions
/////////////////////////
function draw() {
  checkAndUpdate();
  if ((Math.random()<.025)&&(world.bodies.length<10)){
    createNewObject();
  }
  Engine.update(engine, 1000/60);
}

checkAndUpdate = () => {
  world.bodies.forEach((body)=>{
    if (body.label=="Circle Body") { // Only for circle objects
      updateObjectAlpha(body);
      removeDeadObjects(body);
    }
  })
}

createNewObject = () => {
  let xPosition = screenWidth*.4 + (Math.random()*screenWidth*.25),
    yPosition = screenHeight*.025,
    body = Bodies.circle(xPosition, yPosition, circleProperties.size, circleProperties.renderProperties);
    World.add(world, body);
}

updateObjectAlpha = (body) => {
  let alpha; // Initialise alpha
  let position = body.position; // Get the body's position
  let distanceFromXCenter = Math.abs(position.x-screenWidth/2),
    distanceFromYCenter = Math.abs(position.y-screenHeight/2),
    xAlpha = Math.abs(distanceFromXCenter/(screenWidth/2) - 1),
    yAlpha = Math.abs(distanceFromYCenter/(screenHeight/2) - 1);
  if (xAlpha<yAlpha){
    alpha = xAlpha;
  } else {
    alpha = yAlpha
  }
  body.render.opacity = alpha;
}

removeDeadObjects = (body) => {
  // Remove if lower than height
  if (body.position.y > screenHeight){
    World.remove(world, body);
  }    
}


////////////////////////////////////////////////////////////////////////
// SVG Functions
////////////////////////////////////////////////////////////////////////

plotSVGs = () => {
  // Get all SVG paths
  let combinedPaths = [];
  const svgIDs = ["leftM", "rightM"];
  for (let i=0; i<svgIDs.length; i++){
    combinedPaths.push((getSVGPositions(document.getElementById(svgIDs[i]))));
  }

  // Get x and y maxima
  const minAndMax = findMinAndMax(combinedPaths);

  // Scale all of the svg paths
  const xSize = 0.6; const ySize = .8; // WHY 2!!?
  const scaleWidth = xSize * screenWidth;
  const scaleHeight = ySize * screenHeight;
  for (let pathIndex in combinedPaths){
    for (let i=0; i<combinedPaths[pathIndex].length; i++){
      combinedPaths[pathIndex][i].x = scaleSVGCoordinates(combinedPaths[pathIndex][i].x, minAndMax.xHigh, scaleWidth);
      combinedPaths[pathIndex][i].y = scaleSVGCoordinates(combinedPaths[pathIndex][i].y, minAndMax.yHigh, scaleHeight);
    }
  }

  // Add Cs
  combinedPaths.push(drawC(.72*(Math.PI*2), .73*(Math.PI*2), .26*(Math.PI*2), .28*(Math.PI*2)))
  combinedPaths.push(drawC(.22*(Math.PI*2), .21*(Math.PI*2), .05*(Math.PI*2), .05*(Math.PI*2)))

  // Create SVGs
  createSVGs(combinedPaths);
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

// Find maximum values
findMinAndMax = (combinedPaths) => {
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
  for (let path of combinedPaths) {
    currentXDimensions = getLowHighValues(path, 'x');
    if (currentXDimensions.high>xHigh){xHigh = currentXDimensions.high}
    currentYDimensions = getLowHighValues(path, 'y');
    if (currentYDimensions.high>yHigh){yHigh = currentYDimensions.high}
  }
  return {xHigh, yHigh};
}

scaleSVGCoordinates = (currentValue, high, newScale) => {
  let currentPercent = currentValue / high;
  let newValue = currentPercent * newScale;
  return newValue;
}

drawC = (innerStartingTheta, outerEndTheta, innerEndTheta, outerStartingTheta) => {
  const height = .45*screenHeight;
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

createSVGs = (svgPaths) => {
  let polygonObjects = [];
  const polygonPositions = [
    {width: .365*screenWidth, height: .24*screenHeight},
    {width: .67*screenWidth, height: .38*screenHeight}, // right M
    {width: .35*screenWidth, height: .63*screenHeight},
    {width: .65*screenWidth, height: .75*screenHeight},
  ];
  for (let pathIndex in svgPaths){
    polygonObjects.push(Bodies.fromVertices(polygonPositions[pathIndex].width, polygonPositions[pathIndex].height, svgPaths[pathIndex], { isStatic: true, render: barrierProperties}))
  }
  World.add(world, polygonObjects);
}




