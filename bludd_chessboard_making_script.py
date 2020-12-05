def makeBluddGameHTM():
	'''The script I used to create the repetitive parts of bluddGame.htm. Feel free to modify this
	if you want to change the game.
	Just print the return value of this function to get the formatted html.'''
	output='<!DOCTYPE html>\n<html lang ="en">\n<head>\n<title>Bludd game</title> <link rel="stylesheet" href="gameStyles.css">\n</head>\n</body>\n' #add the stuff at the beginning of the file

	for row in range(1,9): #Make the squares
			for col in range(1,9):
				r,c=str(row),str(col)
				if (row+col)%2==0:
					color = 'skyblue'
				else:
					color='bloodred'
				output+= ("<button class='square' onclick='MOVE=getPieceByName(pieceSelected).move(" + str(row) + 
					", " + str(col) + ");\n activePlayer=MOVE[0]; PlayerRotationIndex=MOVE[1]'>\n")
				output+= ("<img class='squareIMG r"+r+'c'+c+"' id='r"+r+'c'+c+"' src='./viking pics/"+
					color+".jpg' title='r"+r+'c'+c+"'>\n")
				output+="</button>\n"

	for j in range(1,9): #Make the pieces
		i=str(j)
		for color in ['red','blue']:
			if j==1:
				name=color+"Queen"
				output+= "<button class='piece' onclick='pieceSelection(\""+name+"\");'>\n"
				output+= ("<img class='pieceIMG "+color+ " Queen' id='" + name +"' src='./"+color+"/"+color+" queen.png' title='" + name+ "'>\n")
				output+= "</button>\n"
				name=color+"King"
				output+= "<button class='piece' onclick='pieceSelection(\""+name+"\");'>\n"
				output+= ("<img class='pieceIMG "+color+ " King' id='" + name +"' src='./"+color+"/"+color+" king.png' title='" + name+ "'>\n")
				output+= "</button>\n"
			if j<3:
				for p in ['Rook','Bishop','Knight']:
					name=color + p + i
					output+= "<button class='piece' onclick='pieceSelection(\""+name+"\");'>\n"
					output+= ("<img class='pieceIMG "+color+ " " + p+ "' id='" + name + "' src='./"+color+"/"+color+ " " + p+".png' title='" + name+ "'>\n")
					output+= "</button>\n"
			name=color + "Pawn" + i
			output+= "<button class='piece' onclick='pieceSelection(\""+name+"\");'>\n"
			output+= ("<img class='pieceIMG "+color+ " Pawn' id='" + name + "' src='./"+color+"/"+color+ " pawn.png' title='" + name+ "'>\n")
			output+= "</button>\n"			

	for i in range(1,9): #add the filenames to the piece descriptions
		for color in ['red','blue']:
			if i==1:
				for p in ['King', 'Queen']:
					output+='"'+color+p+'": \'\', '
				for p in ['Rook', 'Bishop', 'Knight']:
					output+='"'+color+p+str(i)+'": \'\', '
			if i==2:
				for p in ['Rook', 'Bishop', 'Knight']:
					output+='"'+color+p+str(i)+'": \'\', '
			output+='"'+color+'Pawn'+str(i)+'": \'\', '

	output+='</body>\n</html>'
	return output


def makeBluddGameCSS():
	'''The script I used to make the repetitive parts of gameStyles.css. 
	You can modify this as you see fit if you want to alter the game.
	Just print the return value of this function to get the formatted css.'''
	output=''
	for row in range(1,9): #Make the squares
			for col in range(1,9):
				r,c=str(row),str(col)
				output+=('.r'+r+'c'+c+' {\n	  position: absolute;'+
					'\n	  left:'+str(75+100*col)+
					'px;\n	 top:'+str(90+100*row)+'px;\n'+
					'	z-index:1\n}\n') 

	for j in range(1,9): #Make the pieces
		i=str(j)
		for color in ['red', 'blue']:
			if color=='red': top='235px'
			if color=='blue': top='1035px'
			if j==1:
				output+=("#"+color+"Queen {\n	position: absolute;"+
					"\n	  left:560px;\n	  top:" + top + ";\n"+
					'	z-index:2;\n}\n')
				output+=("#"+color+"King {\n   position: absolute;"+
					"\n	  left:660px;\n	  top:" + top + ";\n"+
					'	z-index:2;\n}\n')
				output+=("#"+color+"Rook1 {\n	position: absolute;"+
					"\n	  left:260px;\n	  top:" + top + ";\n"+
					'	z-index:2;\n}\n')
				output+=("#"+color+"Rook2 {\n	position: absolute;"+
					"\n	  left:960px;\n	  top:" + top + ";\n"+
					'	z-index:2;\n}\n')
				output+=("#"+color+"Bishop1 {\n	  position: absolute;"+
					"\n	  left:360px;\n	  top:" + top + ";\n"+
					'	z-index:2;\n}\n')
				output+=("#"+color+"Bishop2 {\n	  position: absolute;"+
					"\n	  left:860px;\n	  top:" + top + ";\n"+
					'	z-index:2;\n}\n')
				output+=("#"+color+"Knight1 {\n	  position: absolute;"+
					"\n	  left:460px;\n	  top:" + top + ";\n"+
					'	z-index:2;\n}\n')
				output+=("#"+color+"Knight2 {\n	  position: absolute;"+
					"\n	  left:760px;\n	  top:" + top + ";\n"+
					'	z-index:2;\n}\n')
			
			if color=='red': top='335px'
			if color=='blue': top='935px'
			output+=("#"+color+"Pawn" + i + " {\n	position: absolute;"+
				"\n	  left:" + str(160+j*100) + "px;\n	 top:" + top + ";\n"+
				'	z-index:2;\n}\n')
		
	return output