"""define Bludd chess moves"""
import random
import pprint
import time


def adjacent_squares(r, c):
    return (
        (r + 1, c + 1),
        (r + 1, c - 1),
        (r - 1, c + 1),
        (r - 1, c - 1),
        (r + 1, c),
        (r - 1, c),
        (r, c + 1),
        (r, c - 1),
    )


SURROUNDING_SQUARES = adjacent_squares(0, 0)


def Bludd_move(r, c):
    R, C = random.choice(adjacent_squares(r, c))
    if R == -1:
        R = 7
    if R == 8:
        R = 0
    if C == -1:
        C = 7
    if C == 8:
        C = 0

    return R, C


def get_player_rotation():
    return ["blue", "red", "Bludd"]


NUM_COLOR_MAP = {0: "red", 1: "blue"}

NUM_PIECE_MAP = {
    0: "Pawn",
    1: "Knight",
    2: "Bishop",
    3: "Rook",
    4: "Queen",
    5: "King",
}


def target_square_legal(R, C, color, board):
    """return a tuple of bools:
    (target square is empty or enemy-occupied, target square is empty)"""
    if R < 0 or R > 7 or C < 0 or C > 7:
        return False, False
    p2 = board[R][C]
    if p2 == 12:
        return True, True
    elif (color == "red" and p2 in RED_TAKEABLE) or (
        color == "blue" and p2 in BLUE_TAKEABLE
    ):
        return True, False

    return False, False


def new_game_board_state():
    return [
        [3, 1, 2, 4, 5, 2, 1, 3],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [12, 12, 12, 12, 12, 12, 12, 12],
        [12, 12, 12, 12, 12, 12, 12, 12],
        [12, 12, 12, 12, 12, 12, 12, 12],
        [12, 12, 12, 12, 12, 12, 12, 12],
        [6, 6, 6, 6, 6, 6, 6, 6],
        [9, 7, 8, 10, 11, 8, 7, 9],
    ]


def empty_bool_board():
    return [[False] * 8 for jj in range(8)]


def empty_board_state():
    return [[12] * 8 for ii in range(8)]


# 12 is for blank spaces, 13 is for Bludd


BLUE_TAKEABLE = {0, 1, 2, 3, 4, 5, 13}

RED_TAKEABLE = {6, 7, 8, 9, 10, 11, 13}


def pawn_moves(r, c, color, board, en_passant_active):
    out = []
    if color == "red":
        # straight moves
        if board[r + 1][c] == 12:
            out.append((r + 1, c))
            if r == 1:
                if board[r + 2][c] == 12:
                    out.append((r + 2, c))  # double-move if it hasn't moved
        # killing moves
        if c != 0 and board[r + 1][c - 1] in RED_TAKEABLE:
            out.append((r + 1, c - 1))
        if c != 7 and board[r + 1][c + 1] in RED_TAKEABLE:
            out.append((r + 1, c + 1))
        # en passant
        if r == 4:
            if c != 0 and en_passant_active == [5, c - 1]:
                out.append((5, c - 1))
            if c != 7 and en_passant_active == [5, c + 1]:
                out.append((5, c + 1))
    else:  # color is blue
        # straight moves
        if board[r - 1][c] == 12:
            out.append((r - 1, c))
            if r == 6:
                if board[r - 2][c] == 12:
                    out.append((r - 2, c))  # double-move if it hasn't moved
        # killing moves
        if c != 0 and board[r - 1][c - 1] in BLUE_TAKEABLE:
            out.append((r - 1, c - 1))
        if c != 7 and board[r - 1][c + 1] in BLUE_TAKEABLE:
            out.append((r - 1, c + 1))
        # en passant
        if r == 3:
            if c != 0 and en_passant_active == [2, c - 1]:
                out.append((2, c - 1))
            if c != 7 and en_passant_active == [2, c + 1]:
                out.append((2, c + 1))

    return out


def knight_moves(r, c, color, board):
    return [
        (R, C)
        for R, C in (
            (r + 2, c + 1),
            (r + 2, c - 1),
            (r - 2, c + 1),
            (r - 2, c - 1),
            (r + 1, c + 2),
            (r + 1, c - 2),
            (r - 1, c + 2),
            (r - 1, c - 2),
        )
        if target_square_legal(R, C, color, board)[0]
    ]


def king_moves(r, c, color, active_player, board, en_passant_active, has_moved):
    out = [
        (R, C)
        for R, C in adjacent_squares(r, c)
        if target_square_legal(R, C, color, board)[0]
    ]
    # castling
    if (not has_moved[r][c]) and active_player == color:
        # only check for castling on active player turn to avoid infinite loops
        enemy_color = "red" if color == "blue" else "blue"
        enemy_moves = all_valid_moves(
            enemy_color, active_player, board, en_passant_active, has_moved
        )
        threatened = [x[1] for x in enemy_moves["kill"] + enemy_moves["other"]]
        queenside_unblocked = True
        for C in [2, 3, 4]:
            if (r, C) in threatened:
                queenside_unblocked = False
        for C in [1, 2, 3]:
            if board[r][C] != 12:
                queenside_unblocked = False
        queenside_rook_unmoved = (
            (board[r][0] == 9 and color == "blue")
            or (board[r][0] == 3 and color == "red")
        ) and not has_moved[r][0]
        if queenside_unblocked and queenside_rook_unmoved:
            out.append((r, 2))
        kingside_unblocked = True
        for C in [4, 5, 6]:
            if (r, C) in threatened:
                kingside_unblocked = False
        for C in [5, 6]:
            if board[r][C] != 12:
                kingside_unblocked = False
        kingside_rook_unmoved = (
            (board[r][7] == 9 and color == "blue")
            or (board[r][7] == 3 and color == "red")
        ) and not has_moved[r][7]
        if kingside_unblocked and kingside_rook_unmoved:
            out.append((r, 6))

    return out


def vector_moves(r, c, color, board, vectors):
    out = []
    for rvec, cvec in vectors:
        R, C = r, c
        while True:
            R, C = R + rvec, C + cvec
            is_legal, is_empty = target_square_legal(R, C, color, board)
            if is_legal:
                out.append((R, C))
            if not is_empty:
                break

    return out


def queen_moves(r, c, color, board):
    return vector_moves(r, c, color, board, SURROUNDING_SQUARES)


def rook_moves(r, c, color, board):
    return vector_moves(r, c, color, board, ((1, 0), (-1, 0), (0, 1), (0, -1)))


def bishop_moves(r, c, color, board):
    return vector_moves(
        r, c, color, board, ((1, 1), (-1, 1), (1, -1), (-1, -1))
    )


MOVE_MAP = {
    0: pawn_moves,
    1: knight_moves,
    2: bishop_moves,
    3: rook_moves,
    4: queen_moves,
    5: king_moves,
}


def all_valid_moves(color, active_player, board, en_passant_active, has_moved):
    moves = {"kill": [], "sac": [], "other": []}
    if color == "red":
        controlled = {0, 1, 2, 3, 4, 5}
        takeable = RED_TAKEABLE
    else:
        controlled = {6, 7, 8, 9, 10, 11}
        takeable = BLUE_TAKEABLE
    for r in range(8):
        for c in range(8):
            p = board[r][c]
            if p in controlled:
                move_func = MOVE_MAP[p % 6]
                if move_func is pawn_moves:
                    new_moves = move_func(r, c, color, board, en_passant_active)
                elif move_func is king_moves:
                    new_moves = move_func(
                        r,
                        c,
                        color,
                        active_player,
                        board,
                        en_passant_active,
                        has_moved,
                    )
                else:
                    new_moves = move_func(r, c, color, board)
                for R, C in new_moves:
                    p2 = board[R][C]
                    MOVE = ((r, c), (R, C))
                    # print({'p': p, 'p2': p2, 'MOVE': MOVE})
                    if p2 == 13:
                        moves["sac"].append(MOVE)
                    elif p2 in takeable or (
                        en_passant_active == [R, C] and (move_func is pawn_moves)
                    ):
                        moves["kill"].append(MOVE)
                    else:
                        moves["other"].append(MOVE)

    return moves


def solicit_square(active, gs, selecting):
    if selecting:
        message = 'piece to move, or "q" to quit'
    else:
        message = (
            'target location, "q" to quit, or "x" to select a different piece'
        )
    while True:
        inp = input(f"Enter a row and column of a {message}:\n").split()
        if inp[0].strip().lower() == "q":
            return "q", None
        elif inp[0].strip().lower() == "x" and not selecting:
            return "x", None
        try:
            r, c = [int(x) for x in inp]
            if selecting:
                if (active == "blue" and gs[r][c] in {6, 7, 8, 9, 10, 11}) or (
                    active == "red" and gs[r][c] in {0, 1, 2, 3, 4, 5}
                ):
                    break
                print("Must select the row and column of a piece you control")
            else:
                if target_square_legal(r, c, active, gs)[0]:
                    break
                print("Must select a reasonable destination square")
        except (IndexError, TypeError, ValueError) as ex:
            print(ex)

    return r, c


def color_board(gs, col_width=7, death_moves = None):
    from colorama import Fore, Back

    out = ""
    for r, row in enumerate(gs):
        for c, p in enumerate(row):
            if death_moves is not None and (r, c) in death_moves:
                out = out + Back.WHITE
            else:
                out = out + Back.RESET
            if p == 13:
                out += Fore.GREEN + "BLUDD".rjust(col_width)
            elif p == 12:
                out += Fore.YELLOW + "X".rjust(col_width)
            else:
                if p < 6:
                    out += Fore.RED + NUM_PIECE_MAP[p % 6].rjust(col_width)
                else:
                    out += Fore.BLUE + NUM_PIECE_MAP[p % 6].rjust(col_width)
        out += "\n" + Fore.RESET + Back.RESET
    return out


def play(
    red_score=0,
    blue_score=0,
    player_rotation_number=0,
    board_state=None,
    has_moved=None,
    en_passant_active=None,
):
    if has_moved is None:
        has_moved = empty_bool_board()
    hm = has_moved
    if en_passant_active is None:
        en_passant_active = [8, 8]
    ep = en_passant_active
    if board_state is None:
        board_state = new_game_board_state()
        bludd_row, bludd_col = random.choices(range(8), k=2)
        if bludd_row in [0, 1] and random.random() < 0.5:
            red_score += 1
        if bludd_row in [6, 7] and random.random() < 0.5:
            blue_score += 1
    else:
        bludd_row, bludd_col = None, None
        for R in range(8):
            for C in range(8):
                if board_state[R][C] == 13:
                    bludd_row, bludd_col = R, C
    gs = board_state
    player_rotation = get_player_rotation()
    gs[bludd_row][bludd_col] = 13
    for ii in range(player_rotation_number, 10_000_000):
        turn, active_num = divmod(ii, 3)
        active = player_rotation[active_num]
        takeable = RED_TAKEABLE if active == "red" else BLUE_TAKEABLE
        print(f"Turn {turn + 1} for player {active}")
        print(f"red_score={red_score}, blue_score={blue_score}")
        no_red_pieces = all(
            not any(x in {0, 1, 2, 3, 4, 5} for x in row) for row in gs
        )
        no_blue_pieces = all(
            not any(x in {6, 7, 8, 9, 10, 11} for x in row) for row in gs
        )
        if no_blue_pieces or no_red_pieces:
            print("Game over")
            return red_score, blue_score
        # print(f'ep = \n{pprint.pformat(ep)}\nhm = \n{pprint.pformat(hm)}')
        print(color_board(gs))
        if active == "Bludd":
            gs[bludd_row][bludd_col] = 12
            bludd_row, bludd_col = Bludd_move(bludd_row, bludd_col)
            if random.random() < 0.5:
                if gs[bludd_row][bludd_col] in RED_TAKEABLE:
                    blue_score += 1
                elif gs[bludd_row][bludd_col] in BLUE_TAKEABLE:
                    red_score += 1
            gs[bludd_row][bludd_col] = 13
        else:
            valmoves = all_valid_moves(active, active, gs, ep, hm)
            # print(valmoves['kill'])
            while True:
                if not any(x for x in valmoves.values()):
                    break
                r, c = solicit_square(active, gs, True)
                if r == "q":
                    return red_score, blue_score, active_num, gs, hm, ep
                p = gs[r][c]
                pname = NUM_PIECE_MAP[p % 6]
                print(f"You have selected {active} {pname} at ({r},{c}).")
                R, C = solicit_square(active, gs, False)
                if R == "x":
                    continue
                elif R == "q":
                    return red_score, blue_score, active_num, gs, hm, ep
                p2 = gs[R][C]
                MOVE = ((r, c), (R, C))
                sac_move, kill_move = False, False
                if valmoves["sac"]:
                    if MOVE not in valmoves["sac"]:
                        print("You must sacrifice to Bludd!")
                        death_moves = [x[1] for x in valmoves['sac']]
                        print(color_board(gs, death_moves = death_moves))
                        continue
                    else:
                        sac_move = True
                elif valmoves["kill"]:
                    if MOVE not in valmoves["kill"]:
                        print("You must slaughter for Bludd!")
                        death_moves = [x[1] for x in valmoves['kill']]
                        print(color_board(gs, death_moves = death_moves))
                        continue
                    else:
                        kill_move = True
                elif valmoves["other"]:
                    if MOVE not in valmoves["other"] and not (
                        kill_move or sac_move
                    ):
                        print("Invalid move")
                        continue
                hm[r][c] = False
                gs[r][c] = 12
                if p2 == 13:
                    if random.random() < 0.5:
                        if active == "blue":
                            blue_score += 1
                        else:
                            red_score += 1
                else:
                    hm[R][C] = True
                    gs[R][C] = p
                    did_en_passant = False
                    if ep == [R, C]:
                        did_en_passant = True
                        if active == "blue":
                            gs[R + 1][C] = 12
                        else:
                            gs[R - 1][C] = 12
                    ep = [8, 8]
                    if p2 in takeable or did_en_passant:
                        if random.random() < 0.5:
                            blue_score += 1
                        else:
                            red_score += 1
                if pname == "Pawn":
                    if R in [0, 7]:
                        print(NUM_PIECE_MAP)
                        new_type = int(
                            input(
                                "Enter a number code to promote your pawn to:\n"
                            )
                        )
                        gs[R][C] = new_type + (6 if active == "blue" else 0)
                    elif abs(R - r) == 2:
                        if active == "blue":
                            ep = [R + 1, C]
                        else:
                            ep = [R - 1, C]
                elif pname == "King":
                    if abs(c - C) == 2:
                        if C == 2:
                            gs[R][3], gs[R][0] = gs[R][0], gs[R][3]
                            hm[R][3], hm[R][0] = True, False
                        elif C == 6:
                            gs[R][5], gs[R][7] = gs[R][7], gs[R][5]
                            hm[R][5], hm[R][7] = True, False
                break
