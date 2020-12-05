//Female champions of Bludd: "Grodnir the Voracious", "Kalik dis'Batn, Corrupter of Hetmil",
//"Bvexcomsa the Unyielding", "Kroldor the Incincerator", "Anja McFike, the Bluddhammer"
//Male champions of Bludd: "Fjordlak the Annihilator, Prophet of Bludd", "Mjork the Ruthless",
//"Jiuktynev the Disembowler", "Grand Crushrider Hqostra", "Zorgothrex, Eldritch Sangromancer"
/*
TODO:
1.See if I can hack my program through the message box.
2. When I disable the forced sacrifices and kills by commenting out the (if moveIllegal) blocks in Piece.move, pieces can't capture or be captured properly. Investigate.
3. The locvalues attribute of pieces (used to assign value to different locations on the board) is the same for all piece types except the pawn. At some point I should probably differentiate the locvalues attributes for the knight, king, queen, rook, and bishop.
*/

var pieceSelected;
pieceSelected="";
var bluddAlwaysMoves=false, blueAlwaysMoves=false, redAlwaysMoves=false; 
var UseEnPassant=true;
var PlayerRotation=["blue", "red", "Bludd"];
var PlayerRotationIndex=0;
activePlayer=PlayerRotation[PlayerRotationIndex];
var activePlayer;

class game_mode {
	constructor(mode) {
		this.insaneMode=mode; //If true, sacrificing and killing is mandatory.
	}
}
var gameMode=new game_mode(true);	

function displayActivePlayer() {
	document.getElementById("ActivePlayer").innerHTML=PlayerRotation[PlayerRotationIndex%3];
	var MOVE=boardState.update();
	return MOVE;
	//return [PlayerRotation[PlayerRotationIndex%3], PlayerRotationIndex];
}

function endTurn() {
	for (var i=0; i<Pieces.length; i++) {
		//This undoes the highlighting of pieces that can kill or sacrifice.
		Pieces[i].display();
	}
	
	if ((activePlayer==="blue" && blueAlwaysMoves) || (activePlayer==="red" && redAlwaysMoves)) {
	    return displayActivePlayer();
	}
	PlayerRotationIndex++;
	activePlayer=PlayerRotation[PlayerRotationIndex%3];
	var pieceList;
	canMove=false;
	if (activePlayer==='blue') {
		pieceList=bluePieces;
	} else if (activePlayer==='red') {
		pieceList=redPieces;
	} else {
		if (Bludd.automove) {
			Bludd.updateScoreboard();
			/*for (let i=0; i<12000000; i++) { //This loop is a crude expedient to make delay 
			//between red's move ending and Bludd moving.
				var z=i**2;
			}*/
			return Bludd.move()
		} else {
			return displayActivePlayer();
		}
	}
	for (var p=0; p<pieceList.length; p++) {
		pieceList[p].findValMoves();
		if (pieceList[p].name.includes('Pawn')) { 
			pieceList[p].enPassantActive=false; 
		}
		if (pieceList[p].validMoves.length>0) { 
			canMove=true;      
		}      
	}
	if (! canMove) { return endTurn(); }
	pieceSelected='';
	return displayActivePlayer();
}

class Piece { 
   constructor(row, col, player, name, showName) {
      this.row=row;
      this.col=col;
	  this.startCol=col;
	  this.startRow=row;
      this.player=player;
      this.name=name;
	  if (! showName) {
		  this.showName=this.name;
	  } else { this.showName=showName; }
      this.validMoves=[];
	  this.hasMoved=false;
      this.deathMsgs=["May my blood be found worthy!", "Arrrrghh! I...die...for...Bludd..."];
      this.killMsgs=["All shall die for Bludd!"];
      this.SacMsgs=["My blood for Bludd!"];
      this.failedSacMsgs=["My Bludd, my Bludd, why have you forsaken meeeee?..."];
      this.moveMsgs=["March for Bludd!"];
   }

   speak(occasion) {
      var utterance;
      if (occasion==="die") {
         utterance=this.deathMsgs[getRndInteger(0,this.deathMsgs.length-1)];
      } else if (occasion==="kill") {
         utterance=this.killMsgs[getRndInteger(0,this.killMsgs.length-1)];
      } else if (occasion==="move") {
         utterance=this.moveMsgs[getRndInteger(0,this.moveMsgs.length-1)];
      } else if (occasion==="sac") {
         utterance=this.SacMsgs[getRndInteger(0,this.SacMsgs.length-1)];
      } else if (occasion==="failedSac") {
         utterance=this.failedSacMsgs[getRndInteger(0,this.failedSacMsgs.length-1)];
      }
      printMsg(utterance, this.showName);
   }

   toString() {
      return "Piece: [name='"+this.name+"', row="+row+", col="+col+", player='"+player+"']"
   }

   /*
   getRow() {
      return this.row;
   }

   getCol() {
      return this.col;
   }

   getPlayer() {
      return this.player;
   }

   getName() {
      return this.name;
   }

   getValidMoves() {
      return this.validMoves;
   }*/

   display() {
      document.getElementById(this.name).style.top=(100+100*this.row) +"px";
      document.getElementById(this.name).style.left=(85+100*this.col) +"px";
	  document.getElementById(this.name).style.border='none';
   }

   getEnemyPieces() {
      if (this.player==='blue') {
         return redPieces;
      } else {
         return bluePieces;
      }
   }

   getInfo() {
      this.findValMoves();
      var pieceInfo= 'current location =[row'+this.row+',col'+this.col+'];'; 
      pieceInfo+='<br>valid moves= [ ';
      for (let m=0; m<this.validMoves.length; m++) { 
		 pieceInfo+='['+ this.validMoves[m]+'],'; 
      } 
      pieceInfo+=' ]';
      document.getElementById('showValidMoves').innerHTML=pieceInfo;
   }
   
   move(newRow, newCol) {
      var sacMoves, killMoves, newrc, numSacMoves=0, numKillMoves=0, moveIllegal=true, badGuys, killing, startscore;
	  if (this.name==='') { return displayActivePlayer(); }
      this.findValMoves();
      if (! bluddHasAwoken) {
         alert("The game can't start until Bludd has been summoned!");
         return displayActivePlayer();
      }
      if (this.player!==activePlayer) {
         alert("It's not your turn.");
         return displayActivePlayer();
      }
      for (let i=0; i<this.validMoves.length; i++) {
         if (newRow===this.validMoves[i][0] && newCol===this.validMoves[i][1]) {
            moveIllegal=false;
            break;
         }
      }
      if (moveIllegal) {
         alert(this.showName + " cannot move to r"+ newRow +"c"+ newCol +".");
         return displayActivePlayer();
      }
	  if (Bludd.pawnToPromote!=='') {
		 alert("Wait while the pawn is being promoted.");
		 return displayActivePlayer();
	  }  
      killMoves=getKillMoves();
      for (var p in killMoves) {
         numKillMoves+=killMoves[p].length;
      }
	  sacMoves=getSacMoves();
      for (var p in sacMoves) {
         numSacMoves+=sacMoves[p].length;
      }

      killing=false;
      moveIllegal=true;      
      if (numSacMoves>0) {
         if (newCol===Bludd.col && newRow===Bludd.row) {
            startscore=Bludd.redSacrificesObserved+Bludd.blueSacrificesObserved;
            Bludd.consume(this);
            if (startscore<Bludd.redSacrificesObserved+Bludd.blueSacrificesObserved) {
               this.speak("sac");
            } else {
               this.speak("failedSac");
            }
            return endTurn();
         }
         if (moveIllegal && gameMode.insaneMode===true) {
			alert("Bludd demands sacrifice! Who are you to deny him?");
			return displayActivePlayer();
         }
      } else if (numKillMoves>0) {
		 var badGuys=this.getEnemyPieces();
         for (let i=0; i<killMoves[this.name].length; i++) {
            if (newCol===killMoves[this.name][i][1] && newRow===killMoves[this.name][i][0]) {
               for (let P=0; P<badGuys.length; P++) {
                  if (badGuys[P].row===newRow && badGuys[P].col===newCol) {
                     Bludd.observeMurder();
                     badGuys[P].hasBeenTaken();
                     moveIllegal=false;
                     killing=true;
					 if ((this.row===newRow) && this.name.includes('Pawn') && (this.showName===this.name)) { this.didEnPassant=true; }
					 //Need to check if showName is the same as true name because a promoted pawn could move in the same row without
					 //doing en Passant if it were promoted.
                  }					  
               }
            }
         }
         if (moveIllegal && gameMode.insaneMode===true) {
			alert("You must slaughter for the glory of Bludd!");
			return displayActivePlayer();
		 }	
      }

      if (killing) {
         this.speak("kill");
      } else { this.speak("move"); }
      this.hasMoved=true;
	  var castleRook;
	  if (this.name.includes("King") && (this.col===5) && (newCol===3)) {
		  castleRook=getPieceByName(this.player+'Rook1')
		  castleRook.col=4;
		  castleRook.display();
		  castleRook.hasMoved=true;
	  } else if (this.name.includes("King") && (this.col===5) && (newCol===7)) {
		  castleRook=getPieceByName(this.player+'Rook2')
		  castleRook.col=6;
		  castleRook.display();
		  castleRook.hasMoved=true;
	  }
	  if (UseEnPassant) {
		  if (this.name.includes('Pawn') && (Math.abs(this.row-newRow)===2) && (this.showName===this.name)) {
			  this.enPassantActive=true;
		  }
		  if (this.name.includes('Pawn') && (this.didEnPassant===true)) {
			  this.didEnPassant=false;
			  if (this.player==='red') {
				  newRow=6;
			  } else if (this.player==='blue') {
				  newRow=3;
			  }
		  }
	  }
      this.col=newCol;
      this.row=newRow;
      this.display();
	  var promotionComplete=false;
	  if ((Math.abs(this.row-this.startRow)===6) && this.name.includes("Pawn") && this.showName===this.name) {
          this.promote();		  
	  }
	  
	  return endTurn();
   }
   
	// simMove(simRow, simCol, row, col, curState) {
		// //A simulated move, made by the AI while determining the optimal move.
		// //Works off of a board state object, and returns a new board state. Does not
		// //cause anything to be displayed on screen.
		// var newstate=new boardState(
		// newstate['children']=[];
		// newstate['parent']=curState.id;
	// }

   hasBeenTaken() {
	  this.hasMoved=true;
      this.row=-1;
      this.col=-1;
      this.validMoves=[];
      document.getElementById(this.name).style.display='none';
      document.getElementById("latestVictim").innerHTML=this.showName;
      if (this.name===pieceSelected) {
         pieceSelected="";
         document.getElementById("PieceSelected").innerHTML="";
         document.getElementById('showValidMoves').innerHTML="<br><br>";
      }
      this.speak("die");
      this.display();
      Bludd.updateScoreboard();
      var gameIsOver=true;
      var redPiecesConsumed=0;
      var bluePiecesConsumed=0;
      if (this.player==='blue') {
         for (let i=0; i<bluePieces.length; i++) {
            if (bluePieces[i].row !== -1) {
               gameIsOver=false;
               break;
            }
         }
      } 
      if (this.player==='red') {
         for (let i=0; i<redPieces.length; i++) {
            if (redPieces[i].row !== -1) {
               gameIsOver=false;
               break;
            }
         }
      }
      if (gameIsOver) {
		Bludd.automove=false; 
        alert("Game over. Bludd observed " + Bludd.redSacrificesObserved + 
               " red sacrifices and " + Bludd.blueSacrificesObserved + 
               " blue sacrifices.");
      }
   }
}


var randrow, randcol, bluddHasAwoken;
bluddHasAwoken=false;
function getRndInteger(min, max) {
  return Math.floor(Math.random() * (max - min + 1) ) + min;
}

function bludd() {
   randrow=getRndInteger(1,8);
   randcol=getRndInteger(1,8);
   this.row=randrow;
   this.col=randcol;
   this.automove=true;
   this.showKillsAndSacs=true;
   this.redSacrificesObserved=0;
   this.blueSacrificesObserved=0;
   this.pawnsPromoted=0;
   this.pawnToPromote='';
   this.strength=3000; //This is the value of sacrificing a piece to Bludd (1/2 the value of an accepted sac)
   this.summonMsg="BLAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADDD!!!!!";
   this.consumeMsgs=["BRUUUUUUUP", "CHOMPSLURPMMMPHCRUNCH", "GRAAAAHRRR"];
}

bludd.prototype.move = function() {
   if (Bludd.pawnToPromote!=='') {
	  if (Bludd.automove === false) {
		alert("Wait while the pawn is being promoted.");
	  }
	  return displayActivePlayer();
   }  
   if (activePlayer !== "Bludd") {
      return displayActivePlayer();
   }
   roll=getRndInteger(1,8);
   moves=[[1,0], [1,1], [0,1], [-1,1], [-1,0], [-1,-1], [0,-1], [1,-1]];
   //rollD8(roll);
   //document.getElementById('d8').src="./viking pics/d8-"+roll+".png";
   this.row = this.row + moves[roll-1][0];
   this.col = this.col + moves[roll-1][1];
   if (this.row<1) {
      this.row=8;
   }
   if (this.row>8) {
      this.row=1;
   }
   if (this.col<1) {
      this.col=8;
   }
   if (this.col>8) {
      this.col=1;
   }
   this.display();
   for (let i=0; i<Pieces.length; i++) {
      p=Pieces[i];
      if (p.row === this.row && p.col === this.col) {
         this.consume(p);
      }
   }
   
   if (! bluddAlwaysMoves) {
	    return endTurn();
   }
}

bludd.prototype.display = function() {
   document.getElementById('Bludd').style.top=(90+100*this.row)+"px";
   document.getElementById('Bludd').style.left=(75+100*this.col)+"px";
   document.getElementById('Bludd').style.display="inline";
   this.updateScoreboard();
}

bludd.prototype.updateScoreboard = function() {
   pieceSelected='';
   document.getElementById("PieceSelected").innerHTML="";
   document.getElementById('showValidMoves').innerHTML="<br><br>";

   document.getElementById('redSacrifices').innerHTML=this.redSacrificesObserved;
   document.getElementById('blueSacrifices').innerHTML=this.blueSacrificesObserved;
   if (this.redSacrificesObserved>this.blueSacrificesObserved) {
      document.getElementById('scoreboard').style.background='rgb(160,0,0)';
   } else if (this.redSacrificesObserved<this.blueSacrificesObserved) {
      document.getElementById('scoreboard').style.background='rgb(0,0,160)';
   } else {
      document.getElementById('scoreboard').style.background='rgb(60,60,60)';
   }
}

function summonBludd() {
	if (! bluddHasAwoken) {
		Bludd=new bludd();
		bluddHasAwoken=true;
		Bludd.display();
		Bludd.speak("summon");
		for (let i=0; i<Pieces.length; i++) {
			p=Pieces[i];
			if (p.row === Bludd.row && p.col === Bludd.col) {
				Bludd.consume(p);
			}
		}
		activePlayer=displayActivePlayer()[0];
	}
}

bludd.prototype.consume = function(p) {
   coinflip=getRndInteger(0,1);
   if (coinflip===1) {
      if (p.player==='red') {
         this.redSacrificesObserved+=1;
      } else {
         this.blueSacrificesObserved+=1;
      }
   }
   p.hasBeenTaken();
   this.speak("consume");
   this.updateScoreboard();
}

bludd.prototype.observeMurder = function() {
   var colors, coinflip;
   coinflip=getRndInteger(0,1);
   colors=['blue', 'red'];
   if (colors[coinflip]==='blue') {
      this.blueSacrificesObserved+=1;
   } else {
      this.redSacrificesObserved+=1;
   }
   this.speak("consume");
   this.updateScoreboard();
}

bludd.prototype.speak = function(occasion) {
   if (occasion==="summon") {
      printMsg(this.summonMsg, "Bludd");
   } else if (occasion==="consume") {
      var msgInd=getRndInteger(0,2);
      printMsg(this.consumeMsgs[msgInd], "Bludd");
   }
}

bludd.prototype.toggleMoveAssistant = function() {
	if (! this.showKillsAndSacs) {
		this.showKillsAndSacs=true;
		document.getElementById('moveAssistantStatus').innerHTML='off';
	} else {
		this.showKillsAndSacs=false;
		document.getElementById('moveAssistantStatus').innerHTML='on';
	}
}	
/*document.getElementById('bluddMove').addEventListener("keydown", (event) => {
   if (event.key==="Enter") {
      Bludd.move();
   }
});*/

function sleep(ms) {
   return new Promise(resolve => setTimeout(resolve, ms));
}
/*
async function rollD8(result) {
   for (let i=1; i<9; i++) {
      document.getElementById('d8').src="./viking pics/d8-"+i+".png";
      setTimeout(200*i);
   }
   document.getElementById('d8').src="./viking pics/d8-"+result+".png";
}
*/

//Set up new instance
class Pawn extends Piece {
   constructor(row, col, player, name) {
		super(row, col, player, name);
		this.deathMsgs=this.deathMsgs.concat(["Bye bye!"]);
		this.killMsgs=this.killMsgs.concat(["Wow, so messy!"]);
		this.SacMsgs=this.SacMsgs.concat(["My daddy would be so proud!"]);
		this.failedSacMsgs=this.failedSacMsgs.concat(["WAHHHH! It's not fair!"]);
		this.moveMsgs=this.moveMsgs.concat(["Hup two three four!"]);
		this.enPassantActive=false;
		this.didEnPassant=false;
		this.strength=100; //Used by AI to evaluate piece importance
	}
   
   findValMoves(simRow=20, simCol=20) {
	  if (simRow<9 && simRow>0 && simCol<9 && simCol>0) {
		  this.row=simRow;
		  this.col=simCol;
	  }
	  if (this.row===-1 && this.col===-1) { return; }
	  
      var kills, firstMove, normalMove;
      this.validMoves=[];
      if (this.player==='red') {
         var kills=[[this.row+1,this.col-1], [this.row+1,this.col+1]]
         var firstMove=[this.row+2,this.col]
         var normalMove=[this.row+1,this.col]
      } else if (this.player==='blue') {
         var kills=[[this.row-1,this.col-1], [this.row-1,this.col+1]]
         var firstMove=[this.row-2,this.col]
         var normalMove=[this.row-1,this.col]
      }
      if ((! isOccupied(normalMove[0], normalMove[1])) && (! hasFriendlyPiece(this.player, normalMove[0],normalMove[1])) && 
            normalMove[0]<=8 && normalMove[0]>0 && normalMove[1]<9 && normalMove[1]>0 &&
            (! hasBludd(normalMove[0], normalMove[1]))) {
         this.validMoves.push(normalMove);
         if ((! isOccupied(firstMove[0], firstMove[1])) && (! this.hasMoved) && 
              (! hasFriendlyPiece(this.player, firstMove[0], firstMove[1])) && firstMove[0]<=8 && firstMove[0]>0 && 
              firstMove[1]<9 && firstMove[1]>0 && (! hasBludd(firstMove[0], firstMove[1]))) {
            this.validMoves.push(firstMove);
         }
      }
      for (let i=0; i<2; i++) {
         if (hasEnemyPiece(this.player, kills[i][0], kills[i][1]) && (! hasFriendlyPiece(this.player, kills[i][0], kills[i][1])) 
               && kills[i][0]<=8 && kills[i][0]>0 && kills[i][1]<9 && kills[i][1]>0) {
            this.validMoves.push(kills[i]);
         }
      }
	  if (UseEnPassant) {
		  for (let enp=0; enp<this.getEnemyPieces().length; enp++) {
			  if (this.player==='blue') {
				  if (redPieces[enp].name.includes('Pawn')) {
					   if (redPieces[enp].enPassantActive && (redPieces[enp].row===this.row) && (Math.abs(this.col-redPieces[enp].col)===1)) {
						   this.validMoves.push([4,redPieces[enp].col]); 
				//The initial location that a pawn moves to with en passant will be sideways
				//as if it were a normal taking move. This simplifies the move function. Later
				//the pawn's newRow will be changed to 3 to match how en Passant actually works.
					   }
				   }
			  } else if (this.player==='red') {
				   if (bluePieces[enp].name.includes('Pawn') && (Math.abs(this.col-bluePieces[enp].col)===1)) {
					   if (bluePieces[enp].enPassantActive && (bluePieces[enp].row===this.row)) {
						   this.validMoves.push([5,bluePieces[enp].col]);
					   }
				   }
			  }
		  }
      }		  
   }
   
   promote() {
	   printMsg("Life looks so different on the other side...", this.name);
	   Bludd.pawnsPromoted++;
	   Bludd.pawnToPromote=this.name;
	   document.getElementById("pawnPromotion").style.display="block";
	   document.getElementById("promQueen").src="./"+this.player+"/"+this.player+" "+'Queen'+'.png';
	   document.getElementById("promRook").src="./"+this.player+"/"+this.player+" "+'Rook'+'.png';
	   document.getElementById("promKnight").src="./"+this.player+"/"+this.player+" "+'Knight'+'.png';
	   document.getElementById("promBishop").src="./"+this.player+"/"+this.player+" "+'Bishop'+'.png';
   }
}

function replacePiece(piece,pieceType) {
   var refname=piece.player+pieceType; //The name of a reference instance of the class to which this thing's 
                   //findValMoves method will be converted.
   if (pieceType!=='Queen') { refname+='1' };
   Bludd.pawnToPromote='';
   piece.showName=piece.player+pieceType+"New"+Bludd.pawnsPromoted;
   //piece.speak=getPieceByName(refname).speak; 
   //I'd need to change the piece's Msg attributes to change its speech.
   // The speak(occasion) method is a parent class method- same for all pieces.
   piece.findValMoves=getPieceByName(refname).findValMoves; //change move-finding method without changing sourcecode
   //change title and image so that it looks like a new piece even though it's not.
   document.getElementById(piece.name).src="./"+piece.player+"/"+piece.player+" "+pieceType+'.png';
   document.getElementById(piece.name).title=piece.showName; 
   document.getElementById("pawnPromotion").style.display="none";
   printMsg("NOW I AM COMPLETE!", piece.showName);
   //return endTurn();
}

class Knight extends Piece {
	constructor(row, col, player, name,showName) {
		super(row, col, player, name,showName);
		this.strength=300;
		this.deathMsgs=this.deathMsgs.concat(["'Tis a mere flesh wound!"]);
		this.killMsgs=this.killMsgs.concat(["Fell deeds awake: fire and slaughter!", "My blade has found thee!"]);
		this.SacMsgs=this.SacMsgs.concat(["Power overwhelming!"]);
		this.failedSacMsgs=this.failedSacMsgs.concat(["Terror all-consuming!"]);
		this.moveMsgs=this.moveMsgs.concat(["Ride now, ride now! Ride for Bludd!"]);
   }
   
   findValMoves(simRow=20, simCol=20) {
	  if (simRow<9 && simRow>0 && simCol<9 && simCol>0) {
		  this.row=simRow;
		  this.col=simCol;
	  }
	  if (this.row===-1 && this.col===-1) { return; }
	  
      this.validMoves=[];
      var newRow, newCol;
      var relmoves=[[2,1], [-2,1], [-2,-1], [2,-1], [1,2], [1,-2], [-1,-2], [-1,2]];
      for (let i=0; i<8; i++) {
         newRow=this.row+relmoves[i][0];
         newCol=this.col+relmoves[i][1];
         if (! hasFriendlyPiece(this.player, newRow, newCol) && newRow<=8 && newRow>0 && newCol<9 && newCol>0) {
            this.validMoves.push([newRow, newCol]);
         }
      }
   }
}

class Bishop extends Piece {
	constructor(row, col, player, name,showName) {
		super(row, col, player, name,showName);
		this.strength=330; //Used by AI to evaluate piece importance
		this.deathMsgs=this.deathMsgs.concat(["What might I behold beyond the veil? About this the Skaript were silent."]);
		this.killMsgs=this.killMsgs.concat(["In frantic melee shall I appease Bludd! So saith the great Kalik dis'Batn."]);
		this.SacMsgs=this.SacMsgs.concat(["Forever after shall I slay for Bludd in the company of the ancient warrior sages!"]);
		this.failedSacMsgs=["Zorgothrex 15.50: Alas! Such is the ineffable will of Bludd."];
		this.moveMsgs=["Grodnir 11.23: A heart inflamed by Bludd cannot know rest!"];
   }
   
   findValMoves(simRow=20, simCol=20) {
	  if (simRow<9 && simRow>0 && simCol<9 && simCol>0) {
		  this.row=simRow;
		  this.col=simCol;
	  }
	  if (this.row===-1 && this.col===-1) { return; }
	  
      this.validMoves=[];
      var directions=[[1,1], [1,-1], [-1,1], [-1,-1]];
      var dir=0, i=0, loops=0;
      for (let dir=0; dir<directions.length; dir++) {
         for (let i=1; i<8; i++) {
            var newRow = this.row+directions[dir][0]*i;
            var newCol = this.col+directions[dir][1]*i;
            if (hasFriendlyPiece(this.player,newRow, newCol) || newRow>8 || newRow<1 || newCol>8 || newCol<1) {
               break;
            } else {
               this.validMoves.push([newRow, newCol]);
               if (hasEnemyPiece(this.player, newRow, newCol)) {
                  break;
               }
            }
         }
      }
   }
}

class Rook extends Piece {
   constructor(row, col, player, name,showName) {
      super(row, col, player, name,showName);
	  this.strength=500;
      this.deathMsgs=["URRRGGG!"];
      this.killMsgs=["SIDDOWN!", "CRUSH 'EM!", "YER DEAD!"];
      this.SacMsgs=["OH YEAH!", "'BOUT TIME!"];
      this.failedSacMsgs=["HELL'S BELLS!", "%$#^!"];
      this.moveMsgs=["CHAAARGE!"];
   }
   
   findValMoves(simRow=20, simCol=20) {
	  if (simRow<9 && simRow>0 && simCol<9 && simCol>0) {
		  this.row=simRow;
		  this.col=simCol;
	  }
	  if (this.row===-1 && this.col===-1) { return; }
	  
      this.validMoves=[];
      var directions=[[1,0], [0,-1], [-1,0], [0,1]];
      var dir=0, i=0, loops=0;
      for (let dir=0; dir<directions.length; dir++) {
         for (let i=1; i<8; i++) {
            var newRow = this.row+directions[dir][0]*i;
            var newCol = this.col+directions[dir][1]*i;
            if (hasFriendlyPiece(this.player,newRow, newCol) || newRow>8 || newRow<1 || newCol>8 || newCol<1) {
               break;
            } else {
               this.validMoves.push([newRow, newCol]);
               if (hasEnemyPiece(this.player, newRow, newCol)) {
                  break;
               }
            }
         }
      }
   }
}

class Queen extends Piece {
   constructor(row, col, player, name,showName) {
      super(row, col, player, name,showName);
	  this.strength=900;
      this.deathMsgs=this.deathMsgs.concat(["At last!"]);
      this.killMsgs=this.killMsgs.concat(["My wrath cannot be sated!", "Doom to all who threaten the homeland!"]);
      this.SacMsgs=this.SacMsgs.concat([]);
      this.failedSacMsgs=this.failedSacMsgs.concat(["My Bludd, what have I done?"]);
      this.moveMsgs=this.moveMsgs.concat(["Make haste! Great things are afoot!"]);
   }

   findValMoves(simRow=20, simCol=20) {
	  if (simRow<9 && simRow>0 && simCol<9 && simCol>0) {
		  this.row=simRow;
		  this.col=simCol;
	  }
	  if (this.row===-1 && this.col===-1) { return; }
	  
      this.validMoves=[];
      var directions=[[1,0], [1,1], [0,1], [-1,1], [-1,0], [-1,-1], [0,-1], [1,-1]];
      for (let dir=0; dir<directions.length; dir++) {
         for (let i=1; i<8; i++) {
            var newRow = this.row+directions[dir][0]*i;
            var newCol = this.col+directions[dir][1]*i;
            if (hasFriendlyPiece(this.player,newRow, newCol) || newRow>8 || newRow<1 || newCol>8 || newCol<1) {
               break;
            } else {
               this.validMoves.push([newRow, newCol]);
               if (hasEnemyPiece(this.player, newRow, newCol)) {
                  break;
               }
            }
         }
      }
   }
}

class King extends Piece {
   constructor(row, col, player, name) {
      super(row, col, player, name);
	  this.strength=200; //This piece importance setting is for B4BTBGOB
	  //this.strength=20000; //Use this in a game of normal chess
      this.deathMsgs=this.deathMsgs.concat([]);
      this.killMsgs=["Ho ho ho! Today is a good day to slay for Bludd!"];
      this.SacMsgs=this.SacMsgs.concat(["Behold! All our blood! Thousandfoooold!"]);
      this.failedSacMsgs=this.failedSacMsgs.concat([]);
      this.moveMsgs=this.moveMsgs.concat([]);
   }
   
   findValMoves(simRow=20, simCol=20) {
		if (simRow<9 && simRow>0 && simCol<9 && simCol>0) {
			this.row=simRow;
			this.col=simCol;
		}
		if (this.row===-1 && this.col===-1) { return; }
		
		this.validMoves=[];
		var directions=[[1,0], [1,1], [0,1], [-1,1], [-1,0], [-1,-1], [0,-1], [1,-1]];
		for (let dir=0; dir<directions.length; dir++) {
			var newRow = this.row+directions[dir][0];
			var newCol = this.col+directions[dir][1];
			if ((! hasFriendlyPiece(this.player,newRow, newCol))  && newRow<=8 && newRow>0 && newCol<9 && newCol>0) {
				this.validMoves.push([newRow, newCol]);
			}
		}
		if (! this.hasMoved && this.player===activePlayer) {
			var canCastleLeft=true, canCastleRight=true;
			if ((getPieceByName(this.player+'Rook1').hasMoved) || (isThreatened(this.row,this.col))) {
				canCastleLeft=false;
			} else {	
				for (let i=2; i<5; i++) {
					if (isOccupied(this.row,i) || hasBludd(this.row,i) || isThreatened(this.row,i)) {
						canCastleLeft=false;
					}
				}
			}
			if ((getPieceByName(this.player+'Rook2').hasMoved) || (isThreatened(this.row,this.col))) {
				canCastleRight=false;
			} else {	
				for (let i=6; i<8; i++) {
					if (isOccupied(this.row,i) || hasBludd(this.row,i) || isThreatened(this.row,i)) {
						canCastleRight=false;
					}
				}
			}
			if (canCastleLeft) { this.validMoves.push([this.row,3]); }
			if (canCastleRight) { this.validMoves.push([this.row,7]); }
		}  
	}
}


//Iniitialize all pieces in their starting locations
var Pieces, redPieces, bluePieces;
var redPawn1=new Pawn(2,1,'red', 'redPawn1');
var redPawn2=new Pawn(2,2,'red', 'redPawn2');
var redPawn3=new Pawn(2,3,'red', 'redPawn3');
var redPawn4=new Pawn(2,4,'red', 'redPawn4');
var redPawn5=new Pawn(2,5,'red', 'redPawn5');
var redPawn6=new Pawn(2,6,'red', 'redPawn6');
var redPawn7=new Pawn(2,7,'red', 'redPawn7');
var redPawn8=new Pawn(2,8,'red', 'redPawn8');
var redKnight1=new Knight(1,2,'red', 'redKnight1');
var redKnight2=new Knight(1,7,'red', 'redKnight2');
var redRook1=new Rook(1,1,'red', 'redRook1');
var redRook2=new Rook(1,8,'red', 'redRook2');
var redBishop1=new Bishop(1,3,'red', 'redBishop1');
var redBishop2=new Bishop(1,6,'red', 'redBishop2');
var redQueen=new Queen(1,4,'red', 'redQueen');
var redKing=new King(1,5,'red', 'redKing');
var redPieces=[redPawn1, redPawn2, redPawn3, redPawn4, redPawn5, redPawn6, redPawn7,
redPawn8, redRook1, redRook2, redBishop1, redBishop2, redKnight1, redKnight2,
redQueen, redKing];

var bluePawn1=new Pawn(7,1,'blue', 'bluePawn1');
var bluePawn2=new Pawn(7,2,'blue', 'bluePawn2');
var bluePawn3=new Pawn(7,3,'blue', 'bluePawn3');
var bluePawn4=new Pawn(7,4,'blue', 'bluePawn4');
var bluePawn5=new Pawn(7,5,'blue', 'bluePawn5');
var bluePawn6=new Pawn(7,6,'blue', 'bluePawn6');
var bluePawn7=new Pawn(7,7,'blue', 'bluePawn7');
var bluePawn8=new Pawn(7,8,'blue', 'bluePawn8');
var blueKnight1=new Knight(8,2,'blue', 'blueKnight1');
var blueKnight2=new Knight(8,7,'blue', 'blueKnight2');
var blueRook1=new Rook(8,1,'blue', 'blueRook1');
var blueRook2=new Rook(8,8,'blue', 'blueRook2');
var blueBishop1=new Bishop(8,3,'blue', 'blueBishop1');
var blueBishop2=new Bishop(8,6,'blue', 'blueBishop2');
var blueQueen=new Queen(8,4,'blue', 'blueQueen');
var blueKing=new King(8,5,"blue", "blueKing");
bluePieces=[bluePawn1, bluePawn2, bluePawn3, bluePawn4, bluePawn5, bluePawn6, bluePawn7,
bluePawn8, blueRook1, blueRook2, blueBishop1, blueBishop2, blueKnight1, blueKnight2,
blueQueen, blueKing];

var Pieces=redPieces.concat(bluePieces);

var nullPiece=new Piece(0,0,'','');
//the nullPiece exists so no error shows up on the console when you click a 
//square with no piece selected.

for (let p=0; p<Pieces.length; p++) {
	Pieces[p].display()
}
/*for (let i=0; i<Pieces.length; i++) {
   var pieceImg=document.getElementById(Pieces[i].name)
   pieceImg.addEventListener("click", () => {
      document.getElementById("PieceSelected").innerHTML=Pieces[i].name;
   });
}*/

function getPieceByName(name) {
   for (let i=0; i<Pieces.length; i++) {
      if (Pieces[i].name===name) {
         return Pieces[i];
      }
   }
   return nullPiece;
}

function hasBludd(Row, Col) {
   return (Row === Bludd.row && Col === Bludd.col);
}

function isOccupied(Row, Col) {
   return (hasBluePiece(Row, Col) || hasRedPiece(Row, Col));
}

function isThreatened(Row, Col) {
	for (var i=0; i<Pieces.length; i++) {
		if (Pieces[i].player!==activePlayer) {
			Pieces[i].findValMoves();
			for (var j=0; j<Pieces[i].validMoves.length; j++) {
				if (Pieces[i].validMoves[j][0]===Row && Pieces[i].validMoves[j][1]===Col) {
					if ((! Pieces[i].name.includes('Pawn')) || (Pieces[i].name.includes('Pawn') && Col!==Pieces[i].col)) {
						return true;
					}
				}
			}
	    }
	}
	var bluddVectors=[[1,0], [1,1], [0,1], [-1,1], [-1,0], [-1,-1], [0,-1], [1,-1]];
	for (i=0; i<bluddVectors.length;i++) {
		if (hasBludd(Row+bluddVectors[i][0],Col+bluddVectors[i][1])) { return true; }
	}
	return false;
}

function hasBluePiece(Row, Col) {
   for (let i=0; i<bluePieces.length; i++) {
      p=bluePieces[i];
      if ((p.row === Row) && (p.col===Col)) {
         return true;
      }
   }
   return false;
}

function hasRedPiece(Row, Col) {
   for (let i=0; i<redPieces.length; i++) {
      p=redPieces[i];
      if ((p.row === Row) && (p.col===Col)) {
         return true;
      }
   }
   return false;
}

function hasEnemyPiece(player, Row, Col) {
   if (player==='blue') {
      return (hasRedPiece(Row, Col) || hasBludd(Row, Col));
   } else if (player==='red') {
      return (hasBluePiece(Row, Col) || hasBludd(Row, Col));
   }
}

function hasFriendlyPiece(player, Row, Col) {
   if (player==='blue') {
      return (hasBluePiece(Row, Col));
   } else if (player==='red') {
      return (hasRedPiece(Row, Col));
   }
}

function pieceSelection(name) {
   var PieceChosen;
   PieceChosen=getPieceByName(name);
   if (name.includes(activePlayer)) {
      pieceSelected=name;
      PieceChosen.getInfo();
      document.getElementById("PieceSelected").innerHTML=PieceChosen.showName;
   } else if (! name.includes(activePlayer)) { 
      if (pieceSelected==="") {
         alert("It's not your turn.");
         return;
      } else if (pieceSelected.includes(activePlayer)) {
         var MOVE=getPieceByName(pieceSelected).move(PieceChosen.row, PieceChosen.col);
         activePlayer=MOVE[0];
         PlayerRotationIndex=MOVE[1];
      }
   }
}

var emptyMoveSet={'redPawn1':[], 'redPawn2':[], 'redPawn3':[], 'redPawn4':[], 'redPawn5':[], 
'redPawn6':[], 'redPawn7':[], 'redPawn8':[], 'redRook1':[], 'redRook2':[], 'redBishop1':[], 
'redBishop2':[], 'redKnight1':[], 'redKnight2':[], 'redQueen':[], 'redKing':[], 'bluePawn1':[], 
'bluePawn2':[], 'bluePawn3':[], 'bluePawn4':[], 'bluePawn5':[], 
'bluePawn6':[], 'bluePawn7':[], 'bluePawn8':[], 'blueRook1':[], 'blueRook2':[], 'blueBishop1':[], 
'blueBishop2':[], 'blueKnight1':[], 'blueKnight2':[], 'blueQueen':[], 'blueKing':[]};

function getSacMoves() {
   var sacMoves=new Object();
   for (var pie in emptyMoveSet) {
      sacMoves[pie]=[];
   }
   for (let x=0; x<Pieces.length; x++) {
      if (! Pieces[x].name.includes(activePlayer)) { continue; }
      Pieces[x].findValMoves();
      for (let i=0; i<Pieces[x].validMoves.length; i++) {
         Move=Pieces[x].validMoves[i];
         if (Bludd.row===Move[0] && Bludd.col===Move[1]) {
            sacMoves[Pieces[x].name].push(Move);
			if (Bludd.showKillsAndSacs) {
				document.getElementById(Pieces[x].name).style.border='5px solid pink';
		        document.getElementById(Pieces[x].name).style.top=(100+100*Pieces[x].row-5) +"px";
				document.getElementById(Pieces[x].name).style.left=(85+100*Pieces[x].col-5) +"px";
			}
         }
      }
   }
   return sacMoves;
}

function getKillMoves(moves) {
   var killMoves=new Object();
   for (var pie in emptyMoveSet) {
      killMoves[pie]=[];
   }
   for (let x=0; x<Pieces.length; x++) {
      if (! Pieces[x].name.includes(activePlayer)) { continue; } //Check only activePlayer pieces
      Pieces[x].findValMoves();
      for (let i=0; i<Pieces[x].validMoves.length; i++) {
         Move=Pieces[x].validMoves[i];
		 //Check if an enemy piece is in a location that the piece could move to.
	     if (hasEnemyPiece(Pieces[x].player, Move[0], Move[1]) && ! hasBludd(Move[0], Move[1])) {
			  killMoves[Pieces[x].name].push(Move);
			  if (Bludd.showKillsAndSacs) {
				document.getElementById(Pieces[x].name).style.border='5px solid lightGreen';
				document.getElementById(Pieces[x].name).style.top=(100+100*Pieces[x].row-5) +"px";
				document.getElementById(Pieces[x].name).style.left=(85+100*Pieces[x].col-5) +"px";
			  }
	     }
      }
   }
   
   return killMoves;
}


document.getElementById('enterMessage').value='';
var message;
messageBox=document.getElementById('enterMessage');
messageBox.addEventListener("keydown", (event) => {
   var speaker=activePlayer+' player'
   if (event.key==="Enter") {
      printMsg(messageBox.value, speaker);
   }
});
function printMsg(message, sender) {
   if (! sender) {
	   sender="Fjordlak the Annihilator";
   }   
   if (sender.includes("blue") && message==="1337 h4x0r") {
	   blueAlwaysMoves=true;
   } else if (sender.includes("red") && message==="1337 h4x0r") {
	   redAlwaysMoves=true;
   } else if (message==='Bluddmove') {
	   Bludd.automove=true;
   } else if (message==='ME HUNGRY' && sender.includes("Bludd")) {
	   bluddAlwaysMoves=true;
   }
   var dt, now;
   dt=new Date();
   now=dt.toString();
   document.getElementById('messages').innerHTML+="<p><hr>On "+now + ", " + sender + " said:<br>"
   if (message.includes("<") && message.includes(">")) {
      document.getElementById('messages').innerHTML+="The message pane will not display HTML-formatted text.</p>";
   } else {
      document.getElementById('messages').innerHTML+=message+"</p>";
   } 
   messageBox.value='';
   var elem = document.getElementById('messageLog');
   elem.scrollTop = elem.scrollHeight;
}
	
function stringToHash(string) {                  
	var hash = 0; 
	
	if (string.length == 0) return hash; 
	  
	for (i = 0; i < string.length; i++) { 
		char = string.charCodeAt(i); 
		hash = ((hash << 5) - hash) + char; 
		hash = hash & hash; 
	} 
	  
	return hash; 
}
	
/*
What the AI should do (at minimum):
1. Check the valid moves. If it can sacrifice, sacrifice the least powerful
piece it can sacrifice.
2. If it can't sacrifice, kill the most powerful piece it can kill.
3. Else, use some move evaluation algorithm, or just make a random move.

Steps in the move evaluation algorithm:
1. Get the current board state.
2. Find valid moves in the current board state.
3. 
/*
These piece importance settings are already in the piece subclasses.
pawn strength=10;
king strength=20;
knight strength=30;
bishop strength=30;
rook strength=50;
queen strength=90;
Value of sacrificing a piece: 300  (600 points for an accepted sacrifice)
Value of ending the game: 500*(your score-their score).
This value for ending the game strongly incentivizes getting your pieces
taken at the end of the game if you're ahead and taking opposing pieces 
at the end of the game if you're behind.

//Suggested king strength in normal chess is 900.
Should somehow discount the values of future board states based on the likelihood that those board states will be achieved. Possible method is weighting opponent's moves based on their quality and dividing the value
of a move from a given board position by a function of the weighted number
of moves opponent and Bludd could make that would not lead to that board
position.
For instance, maybe the AI is evaluating branch 1 where the best move is 
move 1, where it could take the enemy Queen (90 points) against branch 2
where the best move is move 2, where it could sacrifice a pawn (300-10=290 
points). But maybe the weighted number of moves the opponent and Bludd
could make that wouldn't lead to branch 1 is only 100, and the weighted
number of moves an opponent could make that wouldn't lead to branch 2 is
400. Since 290/400<90/100, maybe the move that leads to branch 1 is better
even though its best move is lower quality. 

Should try to implement alpha-beta pruning, where you stop going down a branch
as soon as it's worse than your current worst option.

Here's some alpha-beta pruning pseudo-code from wikipedia.
Cite: https://en.wikipedia.org/wiki/Alpha%E2%80%93beta_pruning#cite_note-RN03-12
function alphabeta(node, depth, α, β, maximizingPlayer) is
    if depth = 0 or node is a terminal node then
        return the heuristic value of node
    if maximizingPlayer then
        value := −∞
        for each child of node do
            value := max(value, alphabeta(child, depth − 1, α, β, FALSE))
            α := max(α, value)
            if α ≥ β then
                break (* β cut-off *)
        return value
    else
        value := +∞
        for each child of node do
            value := min(value, alphabeta(child, depth − 1, α, β, TRUE))
            β := min(β, value)
            if β ≤ α then
                break (* α cut-off *)
        return value

(* Initial call *)
alphabeta(origin, depth, −∞, +∞, TRUE)

*/
 
class gameState {
	constructor(redPoints, bluePoints, depth, branch, Parent, id, scoreDelta, useAI, AIplayer, maxdepth) {
		this.redPoints=redPoints;
		this.bluePoints=bluePoints;
		this.depth=depth;
		this.branch=branch;
		this.Parent=Parent; //This is the id of the parent gameState.
		//You can access the parent by stateList[Parent.id]
		this.id=id;
		this.scoreDelta=scoreDelta;
		this.useAI=useAI;
		this.AIplayer=AIplayer;
		this.maxdepth=maxdepth;
		
		var players=['blue', 'red', 'Bludd'];
		if (this.Parent !== null) {
			var playInd=players.indexOf(this.Parent.active_player);
			this.active_player=players[(playInd+1)%3];
			this.board=stateList[Parent].board;
		} else {
			this.active_player='';
			this.board=[
			[0,0,0,0,0,0,0,0,0],
			[0,0,0,0,0,0,0,0,0],
			[0,0,0,0,0,0,0,0,0],
			[0,0,0,0,0,0,0,0,0],
			[0,0,0,0,0,0,0,0,0],
			[0,0,0,0,0,0,0,0,0],
			[0,0,0,0,0,0,0,0,0],
			[0,0,0,0,0,0,0,0,0],
			[0,0,0,0,0,0,0,0,0]]
		} //The first row and first entry of each column are there so that e.g., [1,1] corresponds
		//to row 1, column 1.
		this.moves=[];
		this.children=[];
		this.lastMove=[];
		this.gameOver=false;
		this.killMoves=[];
		this.sacMoves=[];
		this.averageScoreDelta=0;
		this.minScoreDelta= 1000000;
		this.minID=null;
		this.maxScoreDelta=-1000000;
		this.maxID=null;
	}
	
	update() {
		//At the end of every turn (including Bludd's), the board state is updated to reflect
		//the current location of every piece on the board, the score of each player,
		//which pieces have been taken, and the active player.
		var deadReds=0, deadBlues=0;
		
		for (let r=1; r<9; r++) {
			for (let c=1; c<9; c++) {
				this.board[r][c]=0;
			}
		}
		
		for (let p=0; p<Pieces.length; p++) {
			var pie=Pieces[p];
			var loc=[pie.row,pie.col];
			var pienum=parseNameAsNum(pie.name);
			if (loc[0]===-1) { continue; }
			this.board[loc[0]][loc[1]] = pienum;
		}
		this.board[Bludd.row][Bludd.col]=-Bludd.strength;
		this.lastMove=[];
		this.moves=[];
		this.checkIfGameOver();
		this.active_player=PlayerRotation[PlayerRotationIndex%3];
		this.bluePoints=Bludd.strength*Bludd.blueSacrificesObserved;
		this.redPoints=Bludd.strength*Bludd.redSacrificesObserved;
		this.killMoves=[];
		this.sacMoves=[];
		this.scoreDelta=0;
		this.averageScoreDelta=0;
		this.minScoreDelta= 1e6;
		this.minID=null;
		this.maxScoreDelta=-1e6;
		this.maxID=null;
		//console.log(this);
		// console.log(this.board.toString());
		// console.log({'gameover': this.gameOver, 'activePlayer': this.active_player});
		// if (this.useAI==='true' && this.active_player===this.AIplayer) {
			// return this.spawn();
		// } else {
		return [PlayerRotation[PlayerRotationIndex%3], PlayerRotationIndex];
		//}
	}
	
	isAIcontrolled(nameOrNum) {
		var pienum = (isNaN(nameOrNum) ? parseNameAsNum(nameOrNum) : nameOrNum);
		return (pienum>0 && this.AIplayer==='blue') || (pienum<0 && this.AIplayer==='red');
	}
	
	hasBluePiece(Row, Col) {
		var val=this.board[Row][Col];
		return (val>0 ? val : false);
	}

	hasRedPiece(Row, Col) {
		var val=this.board[Row][Col];
		return ((-Bludd.strength<val && val<0) ? val : false);
	}

	hasEnemyPiece(name, Row, Col) {
		if (name.includes('blue')) {
			return (this.hasRedPiece(Row, Col));
		} else if (name.includes('red')) {
			return (this.hasBluePiece(Row, Col));
		}
	}
	
	hasPiece(Row, Col) {
		var val=this.board[Row][Col];
		return ((val===0 || val===-Bludd.strength) ? false : val);
	}	
	
	hasBludd(Row, Col) {
		return (this.board[Row][Col]===-Bludd.strength);
	}
	
	getLocation(nameOrNum) {
		//Returns [-1,-1] if the named piece is taken or the row and column where that piece is.
		var num = (isNaN(nameOrNum) ? parseNameAsNum(nameOrNum) : nameOrNum);
		for (let r=1; r<9; r++) {
			for (let c=1; c<9; c++) {
				if (num===this.board[r][c]) { return [r,c]; }
			}
		}
		return [-1, -1];
	}
	
	checkIfGameOver() {
		var blueFound=false, redFound=false;
		var bluddstr=-Bludd.strength;
		for (let r=1; r<9; r++) {
			for (let c=1; c<9; c++) {
				if (this.board[r][c]>0) { blueFound=true; }
				if (this.board[r][c]<0 && this.board[r][c]>bluddstr) { redFound=true; }
			}
		}
		this.gameOver = ((blueFound && redFound)===false);
		var diff=this.redPoints-this.bluePoints;
		if (this.gameOver===true) {
			//Assign a high positive value to ending the game if you're way ahead, and a high negative value
			//if you're way behind. Assign a value in the same direction but of much lesser size for ending
			//the game if you're a little ahead (because the game is random and scoring in the search
			//algorithm is deterministic).
			if (diff>=1800) {
				if (this.AIplayer==='red') { this.scoreDelta+=10000; } else {this.scoreDelta-=10000;}
			} else if (diff>=600) {
				if (this.AIplayer==='red') { this.scoreDelta+=850; } else {this.scoreDelta-=850;}
			}
		}
	}
	
	evalLocChange(nameOrNum, row, col, nuro,nucol) {
		//This determines the relative values of different squares on the board.
		var locvalues;
		var name = (isNaN(nameOrNum) ? nameOrNum : parseNumAsName(nameOrNum));
		if (name.includes('Pawn')) {
			var bluelocvalues=[
			[0,0,0,0,0,0,0,0,0],
			[0,325,375,375,375,375,375,375,325],
			[0,80,100,100,100,100,100,100,80],
			[0,-10,10,10,10,10,10,10,-10],
			[0,-20,0,0,0,0,0,0,0,-20],
			[0,25,30,40,30,60,0,30,25],
			[0,-10,10,30,20,30,-20,15,-10],
			[0,0,0,0,0,0,0,0,0],
			[0,0,0,0,0,0,0,0,0]]; 
		} else if (name.includes("Knight")) {
			var bluelocvalues=[
			[0,0,0,0,0,0,0,0,0],
			[0,-80,-60,-40,-40,-40,-40,-60,-80],
			[0,-80,80,60,10,30,60,30,-80],
			[0,-80,80,60,10,30,60,30,-80],
			[0,-60,40,75,100,100,75,40,-60],
			[0,-60,40,75,100,100,75,40,-60],
			[0,-80,-10,60,10,30,60,30,-80],
			[0,-80,-30,-40,0,0,0,-30,-80],
			[0,-80,-60,-40,-40,-40,-40,-60,-80]]; 
		} else if (name.includes('Bishop')) {
			var bluelocvalues=[
			[0,0,0,0,0,0,0,0,0],
			[0,-80,-60,-40,-40,-40,-40,-60,-80],
			[0,-80,80,60,10,30,60,30,-80],
			[0,-80,80,60,10,30,60,30,-80],
			[0,-60,40,75,100,100,75,40,-60],
			[0,-60,40,75,100,100,75,40,-60],
			[0,-80,-10,60,10,30,60,30,-80],
			[0,-80,-30,-40,0,0,0,-30,-80],
			[0,-80,-60,-40,-40,-40,-40,-60,-80]];
		} else if (name.includes('Rook')) {
			var bluelocvalues=[
			[0,0,0,0,0,0,0,0,0],
			[0,-80,-60,-40,-40,-40,-40,-60,-80],
			[0,-80,80,60,10,30,60,30,-80],
			[0,-80,80,60,10,30,60,30,-80],
			[0,-60,40,75,100,100,75,40,-60],
			[0,-60,40,75,100,100,75,40,-60],
			[0,-80,-10,60,10,30,60,30,-80],
			[0,-80,-30,-40,0,0,0,-30,-80],
			[0,-80,-60,-40,-40,-40,-40,-60,-80]];
		} else if (name.includes('Queen')) {
			var bluelocvalues=[
			[0,0,0,0,0,0,0,0,0],
			[0,-80,-60,-40,-40,-40,-40,-60,-80],
			[0,-80,80,60,10,30,60,30,-80],
			[0,-80,80,60,10,30,60,30,-80],
			[0,-60,40,75,100,100,75,40,-60],
			[0,-60,40,75,100,100,75,40,-60],
			[0,-80,-10,60,10,30,60,30,-80],
			[0,-80,-30,-40,0,0,0,-30,-80],
			[0,-80,-60,-40,-40,-40,-40,-60,-80]];
		} else if (name.includes('King')) {
			var bluelocvalues=[
			[0,0,0,0,0,0,0,0,0],
			[0,-80,-60,-40,-40,-40,-40,-60,-80],
			[0,-80,80,60,10,30,60,30,-80],
			[0,-80,80,60,10,30,60,30,-80],
			[0,-60,40,75,100,100,75,40,-60],
			[0,-60,40,75,100,100,75,40,-60],
			[0,-80,-10,60,10,30,60,30,-80],
			[0,-80,-30,-40,0,0,0,-30,-80],
			[0,-80,-60,-40,-40,-40,-40,-60,-80]];
		}
		if (player==='red') {
			var redlocvals=[];
			for (let i=1; i<9; i++) {
				redlocvals.push(bluelocvalues[8-i]);
			}
			locvalues=redlocvals;
		} else { 
			locvalues=bluelocvalues; 
		}
		return locvalues[nuro][nucol]-locvalues[row][col];
	}
	
	getStrength(pieceNum) {
		var num=Math.abs(pieceNum);
		if (num>=redQueen.strength) {
			return redQueen.strength;
		} else if (num>=redRook1.strength) {
			return redRook1.strength;
		} else if (num>=redBishop1.strength) {
			return redBishop1.strength;
		} else if (num>=redKnight1.strength) {
			return redKnight1.strength;
		} else if (num<200 && num!==redKing.strength) {
			return redPawn1.strength;
		} else {
			return redKing.strength;
		}
	}	
	
	spawn() {
		/*Recursively finds new moves, generates new board states, and finds new 
		moves from those board states.
		maxdepth is the total number of turns that the AI "thinks" into the future.
		If maxdepth=0, the AI moves randomly, so this function only handles maxdepth>0.
		E.g., if maxdepth=1, the AI considers all of its possible moves, but does not
		consider what Bludd might do or how the opponent might respond.
		To save memory and time, spawn() does not generate new board states if the
		current board state is at maxdepth-1, because only the moves from this board state
		need to be evaluated.
		Example of how this operates:
		Suppose that maxdepth=3, and spawn() is first triggered on the AI-controlled red
		player's turn.
		First, all valid moves from the current board state (i.e., what the player sees)
		are calculated, with non-sacrifice and non-kill moves evaluated only if no
		sac moves or kill moves are available.
		For each move that is evaluated, a new board state is spawned. For a given move,
		the new board state is changed to reflect the new position of the piece that was moved,
		and the new state is given a lastMove attribute that reflects the piece moved and where
		it went.
		The new state's scoreDelta attribute is also changed to reflect the total (statistically
		expected) change in the score of the player from when the spawn() method was first called.
		So suppose that the move being considered is a red knight sacrificing itself to Bludd.
		Again assuming that the AI player is blue, the expected value of this move is +270 points,
		because the knight was worth 30 points to the AI (-30 points) but the AI has a 50% chance
		of getting a sacrifice recognized (+600 points). The red knight's row and column are
		both updated to -1 in the new board state, and lastMove shows it having moved onto Bludd's
		location.
		A new board state's scoreDelta is initially given its parent's scoreDelta, but it is
		later changed, as described below, and those changes flow back up to its parent.
		
		When the new board state was spawned, the turn automatically rotated to Bludd's turn,
		so now the new board state (at depth=1) will evaluate all of Bludd's possible moves.
		this.depth+1=2<3, so this depth=1 board state will spawn new board states, one for each
		of Bludd's possible moves. If Bludd consumes a piece, that will be duly reflected.
		Each new board state spawned (depth=2, blue player's turn) is evaluated in turn.
		Since depth+1=2+1=3, this board state will only evaluate moves without actually creating
		new board states.
		Here, at the deepest depth=2 board state, the lowest-scoring move is determined.
		You might be thinking- wait, shouldn't you pick the highest-scoring board state?
		But this is a minimax algorithm. Since the deepest board state is the blue player's turn,
		the blue player is trying to minimize the red player's gain, so the algorithm will choose
		the lowest score (from the AI's perspective) it can possibly get at this level.
		
		Note here that this is a depth-first search algorithm. So the algorithm first spawns a
		a depth=1 board state (Bludd's turn), and then spawns the depth=2 children of that board
		state one at a time.
		After the first depth=2 state has been evaluated, the parent (depth=1, Bludd's turn)
		will add the scoreDelta of that state to a running total. Once all of the children of
		the depth=1 state have been evaluated, the scoreDelta of that (depth=1, Bludd's turn)
		state will become the average of the scoreDeltas of its children. This is because each
		of Bludd's moves is equally likely.
		Finally, the first of the depth=1 board states spawned by one of the red AI player's moves
		will come back. The depth=0 board state will set its minScoreDelta and 
		maxScoreDelta both equal to that scoreDelta. Subsequent board states' scoreDeltas that 
		come in will only overwrite the max or the min if they are higher or lower, respectively. 
		The AI will continue spawning depth=1 board states (and the children thereof) until
		it's gone through all of the moves generated by the depth=0 board state.
		The AI will then select the move with the highest scoreDelta (since it's the AI's turn,
		the algorithm wants to maximize the score). Finally, that move will be returned, and
		the player will see the board change to reflect the AI's decision.
		
		maxdepth=1 is a special case, because the progenitor board state (depth=0) should not
		spawn new board states, but it also has to track which moves led to which scoreDeltas.
		So in maxdepth=1, the progenitor will create markedMove objects that contain
		the information about a move, and the scoreDelta associated with that move. That way,
		the progenitor can rank moves by their scoreDelta and choose the highest-scoring one.
		*/
		var [bluddRow, bluddCol]=getLocation('Bludd');
		if (this.active_player=='Bludd') {
			var Bmoves=[[1,0], [1,1], [0,1], [-1,1], [-1,0], [-1,-1], [0,-1], [1,-1]];
			for (let roll=0; roll<8; roll++) {
				var newBluddrow = bluddRow + Bmoves[roll-1][0];
				var newBluddcol = bluddCol + Bmoves[roll-1][1];
				if (newBluddrow<1) {newBluddrow=8;}
				if (newBluddrow>8) {newBluddrow=1;}
				if (newBluddcol<1) {newBluddcol=8;}
				if (newBluddcol>8) {newBluddcol=1;}
				
				var food=this.hasPiece(newBluddrow, newBluddcol); //food for Bludd, that is
				var newScoreDelta=this.scoreDelta;
				if (food!==false) {
					if (isAIcontrolled(food)) {
						newScoreDelta = Bludd.strength - getStrength(food);
					} else {
						newScoreDelta = -(Bludd.strength - getStrength(food));
					}	
				}
				
				if ((this.depth+1)<maxdepth) {
					var newState = new gameState(this.redPoints, this.bluePoints, this.depth+1, branch=this.children.length, Parent=this.id, id=stateList.length, scoreDelta=newScoreDelta, useAI=this.useAI,AIplayer=this.AIplayer, maxdepth=this.maxdepth);
					newState.board[newBluddrow][newBluddcol] = -Bludd.strength;
					this.children.push(newState.id);
					stateList.push(newState);
					newState.spawn()
				} else if ((this.depth+1)===maxdepth) {
					this.children.push(newScoreDelta);
				}
			}
			//Once all child board states have been spawned and their scores calculated, 
			//we sum up the scoreDeltas of those child board states and average them.
			//We have to average all child board states because Bludd moves randomly.
			var totScoreDelta=0;
			for (let c=0; c<8; c++) { //Since this is Bludd's turn, there are only 8 children
				if ((this.depth+1)<maxdepth) {
					totScoreDelta+=children[c]; 
				} else if ((this.depth+1)===maxdepth) {
					var child=stateList[this.children[c]]
					totScoreDelta += child.scoreDelta;
				}
				//We won't include a case for this.depth===0, because the spawn() method is only
				//called during blue or red player's turn.
			}
			this.scoreDelta=totScoreDelta/8;
		} else { //Active player is not Bludd
			//Get valid moves for each piece
			var promotions=['Knight','Bishop','Rook','Queen'];
			for (let p=0; p<Pieces.length; p++) {
				var pie=Pieces[p];
				var pienum=parseNameAsNum(pie.name), floor=10*Math.floor(Math.abs(pienum/10));
				var loc=getLocation(pienum);
				//Check if the piece was promoted in this board state.
				if (Math.abs(pienum) !== floor) { //is pawn, was promoted.
					var newtype=promotions[Math.abs(pienum)-floor-1];
					if (newtype==='Queen') {
						//The exemplar is a typical member of the type the pawn was promoted to.
						var exemplar = pie.player+newtype;
					} else {
						var exemplar = pie.player+newtype+'1';
					}
					exemplar.findValMoves(loc[0],loc[1]);
				} else { //normal piece, move normally.
					pie.findValMoves(loc[0],loc[1]);
				}
				for (let m=0; m<pie.validMoves.length; m++) {
					var move=pie.validMoves[m];
					this.moves.push([loc,move]);
				}
				var moves=this.moves;
				//Check if a valid move encounters Bludd or an enemy piece
				for (let m=0; m<moves.length; m++) {
					var move= moves[m];
					var nuro=move[1][0];
					var nucol=move[1][1];
					if (this.hasBludd(nuro, nucol)) { //moves onto Bludd are sacMoves
						//hasBludd returns a boolean
						this.sacMoves.push(move);
					}
					var enemy=this.hasEnemyPiece(pie.name,nuro,nucol);
					//moves onto an enemy are kill moves
					//hasEnemyPiece returns either false, or a piece object.
					if (enemy!==false) {
						this.killMoves.push(move);
					}
				}
			}
			//Iterate through all sacMoves
			if (this.maxdepth===0) {
				//Don't waste time calculating if you're gonna make a random move
			} else if (this.sacMoves.length>0) {
				for (let m=0; m<this.sacMoves.length; m++) {
					var move=this.sacMoves[m];
					var [oldrow,oldcol]=move[0];
					var pienum=board[oldrow][oldcol];
					var Str = getStrength(pienum);
					var scoreDeltaChange;
					if (isAIcontrolled(pienum)) {
						scoreDeltaChange = -(300-Str);
					} else {
						scoreDeltaChange = (300-Str);
					}
					//If this is an intermediate layer
					if (this.depth+1<maxdepth) {
						var newState = new gameState(this.redPoints, this.bluePoints, this.depth+1, branch=this.children.length, Parent=this.id, id=stateList.length, scoreDelta=this.scoreDelta, useAI=this.useAI,AIplayer=this.AIplayer, maxdepth=this.maxdepth);
						newState.lastMove=move;
						newState.board[oldrow][oldcol]=0;
						if (pienum<0) {newState.redPoints+=300;} else {newState.bluePoints+=300;}
						newState.scoreDelta += scoreDeltaChange;				
						stateList.push(newState);
						this.children.push(newState.id);
						newState.checkIfGameOver();
						if (newState.gameOver===false) { newState.spawn(); }
					} else if (this.depth===0 && maxdepth===1) {
						//Special case where this is both the first and last move explored-
						//need to create a move with its scoredelta listed.
						var markedMove=[move,scoreDeltaChange];
						this.children.push(markedMove);
					} else if (this.depth===maxdepth-1) {
						//terminal layer- only determine if this is the best or worst possibility
						//considered so far.
						if ((this.scoreDelta+scoreDeltaChange)>this.maxScoreDelta) {
							this.maxScoreDelta=this.scoreDelta+scoreDeltaChange;
						}
						if ((this.scoreDelta+scoreDeltaChange)<this.minScoreDelta) {
							this.minScoreDelta=this.scoreDelta+scoreDeltaChange;
						}
					}
				}
			} else if (this.killMoves.length>0) {
				for (let m=0; m<this.killMoves.length; m++) {
					var move=moves[m]; var [from,to]=move;
					var [oldrow,oldcol]=from, [newrow,newcol]=to;
					var killer=this.board[oldrow][oldcol];
					var victim = this.board[newrow][newcol];
					var victimStrength=getStrength(victim);
					var scoreDeltaChange = victimStrength*((isAIcontrolled(killer)) ? 1 : -1);
					if (this.depth+1<maxdepth) {
						var newState = new gameState(this.redPoints, this.bluePoints, this.depth+1, branch=this.children.length, Parent=this.id, id=stateList.length, scoreDelta=this.scoreDelta, useAI=this.useAI,AIplayer=this.AIplayer, maxdepth=this.maxdepth);
						newState.lastMove=move;
						newState.board[oldrow][oldcol]=0;
						newState.board[newrow][newcol]=killer;
						newState.scoreDelta += scoreDeltaChange;
						stateList.push(newState);
						this.children.push(newState.id);
						newState.checkIfGameOver();
						if (newState.gameOver===false) { newState.spawn(); }
					} else if (this.depth===0 && maxdepth===1) {
						//Special case where this is both the first and last move explored-
						//need to create a move with its scoredelta listed.
						var markedMove=[move,scoreDeltaChange];
						this.children.push(markedMove);
					} else if (this.depth===maxdepth-1) {
						//terminal layer- only determine if this is the best or worst possibility
						//considered so far.
						if ((this.scoreDelta+scoreDeltaChange)>this.maxScoreDelta) {
							this.maxScoreDelta=this.scoreDelta+scoreDeltaChange;
						}
						if ((this.scoreDelta+scoreDeltaChange)<this.minScoreDelta) {
							this.minScoreDelta=this.scoreDelta+scoreDeltaChange;
						}
					}
				}	
			} else if (this.moves.length>0) { //No kill moves or sac moves to make
				var bluddAdjacentSquares=[];
				var Bmoves=[[1,0], [1,1], [0,1], [-1,1], [-1,0], [-1,-1], [0,-1], [1,-1]];
				for (let roll=0; roll<8; roll++) {
					var [newBluddrow, newBluddcol] = [bluddRow + Bmoves[roll-1][0], bluddCol + Bmoves[roll-1][1]];
					if (newBluddrow<1) {newBluddrow=8;}
					if (newBluddrow>8) {newBluddrow=1;}
					if (newBluddcol<1) {newBluddcol=8;}
					if (newBluddcol>8) {newBluddcol=1;}
					bluddAdjacentSquares.push([newBluddrow,newBluddcol]);
				}
				for (let m=0; m<this.moves.length; m++) {
					var thisMoveValue=0;
					var move=moves[m]; var [from,to]=move;
					var [oldrow,oldcol]=from, [newrow,newcol]=to;
					var num=this.board[oldrow][oldcol];
					var alreadyAdjacent=false, bluddAdj=false;
					for (let sq=0; sq<8; sq++) {
						var square = bluddAdjacentSquares[sq];
						alreadyAdjacent=(square[0]===oldrow && square[1]===oldcol);
						bluddAdj=((square[0]===newrow) && (square[1]===newcol));
					}
					if (alreadyAdjacent===false && bluddAdj===true) {
						//Reward moves to a Bludd-adjacent square IF the piece is not already
						//adjacent. However, this is less valuable to blue pieces than red pieces,
						//because if a blue piece moves adjacent to Bludd, the red piece can take the
						//adjacent blue piece before Bludd moves.
						thisMoveValue += ((num>0) ? Bludd.strength/9 : Bludd.strength/7)*((isAIcontrolled(num)) ? 1 : -1);
					} else if (alreadyAdjacent===true && bluddAdj===false) {
						//Penalize moves to a non-Bludd-adjacent square IF the piece is already
						//adjacent to Bludd
						thisMoveValue -= ((num>0) ? Bludd.strength/9 : Bludd.strength/7).toFixed()*((isAIcontrolled(num)) ? 1 : -1);
					}
					thisMoveValue+=evalLocChange(num,oldrow,oldcol,newrow,newcol)*((isAIcontrolled(num)) ? 1 : -1);
					if (this.depth+1<maxdepth) {
						//If this is an intermediate layer
						var newState = new gameState(this.redPoints, this.bluePoints, this.depth+1, branch=this.children.length, Parent=this.id, id=stateList.length, scoreDelta=this.scoreDelta, useAI=this.useAI,AIplayer=this.AIplayer, maxdepth=this.maxdepth);
						newState.lastMove=move;
						newState.board[oldrow][oldcol]=0;
						newState.scoreDelta += thisMoveValue;				
						stateList.push(newState);
						this.children.push(newState.id);
						newState.checkIfGameOver();
						if (newState.gameOver===false) { newState.spawn(); }
					} else if (this.depth===0 && maxdepth===1) {
						//Special case where this is both the first and last move explored-
						//need to create a move with its scoredelta listed.
						var markedMove=[move,thisMoveValue];
						this.children.push(markedMove);
					} else if (this.depth===maxdepth-1) {
						//terminal layer- only determine if this is the best or worst possibility
						//considered so far.
						if ((this.scoreDelta+thisMoveValue)>this.maxScoreDelta) {
							this.maxScoreDelta=this.scoreDelta+thisMoveValue;
						}
						if ((this.scoreDelta+thisMoveValue)<this.minScoreDelta) {
							this.minScoreDelta=this.scoreDelta+thisMoveValue;
						}
					}	
				}
			} else if (this.moves.length===0) {
				return endTurn;
			}
			//Now all subtrees of this tree have been explored- time to figure out which is best
			var bestScore=-1000000, worstScore=1000000, bestMove, bestChildNum;
			for (m=0; m<this.children.length; m++) {
				if (this.maxdepth===0) {
				} else if (this.depth===0 && maxdepth===1) {
					//var markedMove=[move,scoreDeltaChange];
					if (this.children[m][1]>=bestScore) {
						//Let moves reached later supersede equal scores of previous moves,
						//because most pawns come after other pieces in the piece list,
						//and, all else equal, moving a pawn is generally better because it frees
						//your other pieces.
						bestScore=child[1];
						bestMove=child[0];
					}
				} else if (this.depth===0) {
					var child=stateList[this.children[m]];
					if (child.scoreDelta>=bestScore) {
						bestScore=child.scoreDelta;
						bestMove=child.lastMove;
					}
				} else if ((this.depth+1)<maxdepth) {
					var child=stateList[this.children[m]];
					if (child.scoreDelta>=bestScore && active_player===this.AIplayer) {
						bestScore=child.scoreDelta;
						bestChildNum=m;
					} else if (child.scoreDelta<=worstScore && active_player!==this.AIplayer) {
						worstScore=child.scoreDelta;
						bestChildNum=m;
						this.scoreDelta=child.scoreDelta;
					}
				}
			}
			if (this.depth===0) {
				var randMove = (this.maxdepth===0); //If randMove, choose a move at random.
				if (this.maxdepth===0) { //make a random move if no depth
					if (this.sacMoves.length>0) {
						var rand=getRndInteger(0,this.sacMoves.length-1);
						var bestMove=this.sacMoves[rand];
					} else if (this.killMoves.length>0) {
						var rand=getRndInteger(0,this.killMoves.length-1);
						var bestMove=this.killMoves[rand];
					} else if (this.moves.length>0) {
						var rand=getRndInteger(0,this.moves.length-1);
						var bestMove=this.moves[rand];
					}	
				}
				//Now make the best move found
				var nameToMove=parseNumAsName(this.board[bestMove[0][0]][bestMove[0][1]])
				var pieceToMove=getPieceByName(nameToMove);
				return pieceToMove.move(bestMove[1][0],bestMove[1][1]);
			}
		}
		
	}
	
}

var boardState=new gameState(redPoints=0, bluePoints=0, depth=0, branch=0, Parent=null, id=0, scoreDelta=0, useAI=true, AIplayer='blue', maxdepth=0);
var stateList=[boardState];
//stateList is a container for all gameStates explored by the AI while planning its next move.
//Every time a new gameState is created, its id is set to the length of the stateList and then
//the gameState is added to stateList.

function neg1IfRedAI(player) {
	return (this.AIplayer==='red' ? -1 : 1);
}

function parseNameAsNum(name) {
	//Basically, a name parsed as a number is 10*the piece's strength+10*its ascension number+
	//[1,2,3,or 4] if it's a pawn that was promoted.
	//The number is positive if the piece is blue, negative if red.
	//So redQueen's number is -90*10=-900, blueBishop1 would be 33*10+1*10=340,
	//unpromoted redPawn2 would be -10*10+2*10=-120,
	//and bluePawn7 promoted to a rook would be 10*10+7*10+3=173.
	if (name==='Bludd') { return -Bludd.strength; }
	var typeList=['Pawn','Knight','Bishop','Rook','King','Queen'];
	var strengthList=[100,300,330,500,200,900];
	var promotions=['Knight','Bishop','Rook','Queen'];
	var sign=(name.includes('blue') ? 1 : -1);
	var num;
	for (let i=0; i<6; i++) {
		if (name.includes(typeList[i])) { 
			num=strengthList[i]; 
			if (i===0) { //it's a pawn
				var show=getPieceByName(name).showName;
				if (name !== show) { //it's been promoted
					for (let p=0; p<4; p++) {
						if (show.includes(promotions[p])) {
							num+=p+1;
						}
					}
				}
			}	
		}
	}
	for (let i=1; i<9; i++) { if (name.includes(i)) { num+=10*i; } }
	return num*sign;	
}

function parseNumAsName(num) {
	var numlist=[-Bludd.strength, -200,-900,-510,-340,-310,-110,200,900,510,340,310,110,-520,-350,-320,-120,520,350,320,120,-130,130,-140,140,-150,150,-160,160,-170,170,-180,180];
	var namelist=['Bludd',"redKing", "redQueen", "redRook1", "redBishop1", "redKnight1", "redPawn1", "blueKing", "blueQueen", "blueRook1", "blueBishop1", "blueKnight1", "bluePawn1", "redRook2", "redBishop2", "redKnight2", "redPawn2", "blueRook2", "blueBishop2", "blueKnight2", "bluePawn2", "redPawn3", "bluePawn3", "redPawn4", "bluePawn4", "redPawn5", "bluePawn5", "redPawn6", "bluePawn6", "redPawn7", "bluePawn7", "redPawn8", "bluePawn8"];
	var floor = 10*Math.floor(Math.abs(num/10));
	floor = ((num<0) ? -floor : floor);
	for (let n=0; n<numlist.length; n++) {
		if (floor===numlist[n]) {
			return namelist[n];
		}
	}
}	


// class Robot {
	// constructor(player, randMove, depth=4) {
		// this.player=player;
		// this.randMove=randMove;
		// this.depth=depth;
	// }
	
	// makeMove() {
		// var sacMoves, killMoves, newrc, numSacMoves=0, numKillMoves=0, moveIllegal=true, badGuys, killing, startscore;
	
		
		// killMoves=getKillMoves();
		// for (var p in killMoves) {
			// numKillMoves+=killMoves[p].length;
		// }

		// sacMoves=getSacMoves();
		// for (var p in sacMoves) {
			// numSacMoves+=sacMoves[p].length;
		// }
		
		// if (numSacMoves>0) {
			// //Choose a sac move
		// }
	// }	
// }

/*
window.setInterval(function() {
  var elem = document.getElementById('data');
  elem.scrollTop = elem.scrollHeight;
}, 5000); This autoscrolls to the bottom of a div every five seconds.*/
/*
function passTurn() {
   var pieceList;
   var canMove=false;
   if (activePlayer==='blue') {
      pieceList=bluePieces;
   } else if (activePlayer==='red') {
      pieceList=redPieces;
   } else {
      alert("Bludd roams free, and no mere mortal can 'pass his turn!'");
      return displayActivePlayer();
   }
   for (var p=0; p<pieceList.length; p++) {
      pieceList[p].findValMoves();
      if (pieceList[p].validMoves.length>0) { 
         canMove=true;
         alert("Coward! Don't dare try to shirk your responsibility to Bludd unless you truly can't move!");
         return displayActivePlayer();         
      }      
   }
   PlayerRotationIndex++;
   pieceSelected='';
   return displayActivePlayer();
}
*/
