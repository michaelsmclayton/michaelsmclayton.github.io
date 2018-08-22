import React, { Component } from 'react';
import BouncingBallsLogo from './components/BouncingBallsLogo'

class App extends Component {

  // Set image parameters
  constructor(props) {
    super(props);
    this.state = {
      backgroundColor: this.randomColourPick(), //"#07A",
      textColour: "#FFF" // "#DDD"
    };
    this.screenHeight = window.innerHeight;
    this.screenWidth = this.screenHeight * .8;
    if (this.screenWidth > window.innerWidth){
      this.screenWidth = window.innerWidth;
    }
  }

  componentDidMount(){
    document.body.style = `background: ${this.state.backgroundColor}; overflow-x: hidden;`;
  }

  randomColourPick(){
    const arrayOfColours = ["#E74C3C", "#2980B9", "#3498DB", "#27AE60"];
    let randomIndex = Math.floor(Math.random()*arrayOfColours.length);
    return arrayOfColours[randomIndex];
  }

  render() {
    if (window.innerWidth>window.innerHeight){this.screenWidth = .3} else {this.screenWidth = 1.0}
    return (
      <div>
        <div style={{display:'flex', backgroundColor: this.state.backgroundColor, border:'0px solid', alignItems:'center', justifyContent: 'center', height: this.screenHeight}}>
          <BouncingBallsLogo backgroundColor={this.state.backgroundColor} textColour={this.state.textColour} screenWidth={this.screenWidth}/>
        </div>
      </div>
    );
  }
}

export default App;
