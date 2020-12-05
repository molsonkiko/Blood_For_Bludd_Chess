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
		console.log(this);
		// console.log(this.board.toString());
		// console.log({'gameover': this.gameOver, 'activePlayer': this.active_player});
		if (this.useAI==='true' && this.active_player===this.AIplayer) {
			return this.spawn();
		} else {
			return [PlayerRotation[PlayerRotationIndex%3], PlayerRotationIndex];
		}
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