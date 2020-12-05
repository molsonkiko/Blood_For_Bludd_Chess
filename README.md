# Blood_For_Bludd_Chess
Blood for Bludd, the Blood God (of Blood)! A simple JavaScript game based on chess and deranged cultists.

In <em>Blood for Bludd, the Blood God (of Blood)</em>, both players play with normal chess pieces, with standard movement rules. To start a new game, load up bluddGame.htm on your browser and select Deranged Mode. <em>Do not try playing the game in Sane Mode- it is broken!</em> If somebody else wants to try and fix it, I'd love to know how they did it.

<b>To move, click on a piece, and then click on the destination square.</b> Don't try to drag the piece. A note- En Passant is in this game, but if you want to move En Passant with a pawn, you have to click on the pawn that you would take, rather than on the square that the pawn will end up in. This is important because you will frequently be required to take pawns by En Passant. If you want to play without this rule, go to line 15 of bludgame.js and set UseEnPassant=false.
Unlike normal chess, the king isn't special, for reasons that will quickly become apparent.


Rather than trying to defeat your opponent in a contest of strategy and wits, <b>your goal in B4BtBGoB is to win the favor of the ravenous and unfeeling Bludd by feeding your cultists to him</b>. Bludd is an indestructible, mindless creature that moves randomly around the board and consumes everything he touches. The game begins with Bludd appearing on a random square. If Bludd appears on top of a piece, that piece is immediately consumed. Your cultists are desperate to earn Bludd's favor, and so <b>if you can sacrifice a piece to Bludd, you must do so. Your cultists are also homicidal lunatics, and so even if none of them can sacrifice itself to Bludd, if one or more of them can kill an opposing piece, they must do so. The game ends when all the cultists of one color have died in glorious battle.</b><br>

Whenever you sacrifice a piece to Bludd, there is a 50% chance that Bludd will observe your sacrifice and give you a point. Whenever a piece is killed, Bludd randomly decides which player to give a point to. So a good strategy might be to force your opponent to kill a lot of your pieces because at least they won't be sacrificing to Bludd. But the game is far to random to make any strategy highly effective, as far as I can see.

OPEN ISSUES THAT OTHER PEOPLE COULD FIX-

1. Making Sane Mode work. Essentially, this would let you play normal chess (no forced sacrifices or killing), but with Bludd, the Blodd God (of Blood)! Currently, this mode is broken because if you try to take a piece in Sane Mode, the piece doesn't actually disappear from the board and isn't taken. Also, I haven't implemented code that would force you to move the king if he's in check.

2. Adding an AI to the game. As you can see from looking at bludgame.js, there is code (in the boardState class and especially in the boardState.update() and boardState.spawn() methods) that would enable an AI to control one of the players. Currently this does not work and I gave up on it because I am satisfied with the current state of the project. Maybe the Alpha team can make AlphaBludd and train an AI to become legendarily strong at B4BtBGoB.

As with the dframe Python project, I am most likely never going to make significant changes to this repository after these initial commits. It is here because (a) I want other people to be able to enjoy the game and (b) I want to demonstrate my ability to write JavaScript.
