from gameplay import *

# import pprint


def castle_test():
    for active in ["blue", "red"]:
        hm = empty_bool_board()
        ep = [8, 8]
        gs_castle_u = [[12] * 8 for ii in range(8)]
        if active == "blue":
            inactive = "red"
            r = 7
            gs_castle_u[7][0] = gs_castle_u[7][7] = 9
            gs_castle_u[7][4] = 11
            gs_castle_u[3][7] = 2
        else:
            inactive = "blue"
            r = 0
            gs_castle_u[0][0] = gs_castle_u[0][7] = 3
            gs_castle_u[0][4] = 5
            gs_castle_u[4][7] = 8

        # red bishop threatens col 3, so queenside castle is illegal.
        # kingside castle is legal though.
        valmoves_u = all_valid_moves(active, active, gs_castle_u, ep, hm)
        if ((r, 4), (r, 6)) not in valmoves_u["other"]:
            print(
                f"Failed to find valid {active} kingside castle when {inactive} bishop threatens queenside, kingside legal, all pieces unmoved"
            )
        if ((r, 4), (r, 2)) in valmoves_u["other"]:
            print(
                f"Incorrectly found invalid {active} queenside castle when {inactive} bishop threatens queenside, kingside legal, all pieces unmoved"
            )

        # now red bishop will threaten col 4 so no castles are legal
        if active == "blue":
            gs_castle_u[3][7] = 12
            gs_castle_u[4][7] = 2
        else:
            gs_castle_u[4][7] = 12
            gs_castle_u[3][7] = 8
        valmoves_u = all_valid_moves(active, active, gs_castle_u, ep, hm)
        if ((r, 4), (r, 6)) in valmoves_u["other"]:
            print(
                f"Incorrectly found invalid {active} kingside castle when {inactive} bishop threatens {active} king, all pieces unmoved"
            )
        if ((r, 4), (r, 2)) in valmoves_u["other"]:
            print(
                f"Incorrectly found invalid {active} queenside castle when {inactive} bishop threatens {active} king, all pieces unmoved"
            )

        # now red bishop will threaten col 5 so kingside castle is illegal
        if active == "blue":
            gs_castle_u[4][7] = 12
            gs_castle_u[5][7] = 2
        else:
            gs_castle_u[3][7] = 12
            gs_castle_u[2][7] = 8
        valmoves_u = all_valid_moves(active, active, gs_castle_u, ep, hm)
        if ((r, 4), (r, 6)) in valmoves_u["other"]:
            print(
                f"Incorrectly found invalid {active} kingside castle when {inactive} bishop threatens kingside, queenside legal, all pieces unmoved"
            )
        if ((r, 4), (r, 2)) not in valmoves_u["other"]:
            print(
                f"Failed to find valid {active} queenside castle when {inactive} bishop threatens kingside, queenside legal, all pieces unmoved"
            )

        # now queenside rook has moved, kingside threatened, no castles legal
        if active == "blue":
            hm[7][0] = True
        else:
            hm[0][0] = True
        valmoves_u = all_valid_moves(active, active, gs_castle_u, ep, hm)
        if ((r, 4), (r, 6)) in valmoves_u["other"]:
            print(
                f"Incorrectly found invalid {active} kingside castle when {inactive} bishop threatens kingside, queenside rook moved"
            )
        if ((r, 4), (r, 2)) in valmoves_u["other"]:
            print(
                f"Incorrectly found invalid {active} queenside castle when {inactive} bishop threatens kingside, queenside rook moved"
            )

        # now kingside rook has moved, queenside threatened, no castles legal
        if active == "blue":
            hm[7][0] = False
            hm[7][7] = True
            gs_castle_u[5][7] = 12
            gs_castle_u[3][7] = 2
        else:
            hm[0][0] = False
            hm[0][7] = True
            gs_castle_u[2][7] = 12
            gs_castle_u[5][7] = 8
        valmoves_u = all_valid_moves(active, active, gs_castle_u, ep, hm)
        if ((r, 4), (r, 6)) in valmoves_u["other"]:
            print(
                f"Incorrectly found invalid {active} kingside castle when {inactive} bishop threatens kingside, queenside rook moved"
            )
        if ((r, 4), (r, 2)) in valmoves_u["other"]:
            print(
                f"Incorrectly found invalid {active} queenside castle when {inactive} bishop threatens kingside, queenside rook moved"
            )

        hm = empty_bool_board()
        if active == "blue":
            gs_castle_u[3][7] = 12
        else:
            gs_castle_u[5][7] = 12
        # queenside castle obstructed by friendly piece, kingside open
        for C in [1, 2, 3]:
            gs_castle_u[r][C] = 8 if active == "blue" else 2
            # print(locals())
            valmoves_u = all_valid_moves(active, active, gs_castle_u, ep, hm)
            if ((r, 4), (r, 6)) not in valmoves_u["other"]:
                print(
                    f"Failed to find valid {active} kingside castle when {active} bishop obstructs queenside, all pieces unmoved"
                )
            if ((r, 4), (r, 2)) in valmoves_u["other"]:
                print(
                    f"Incorrectly found invalid {active} queenside castle when {active} bishop obstructs queenside, all pieces unmoved"
                )
            gs_castle_u[r][C] = 12
        # kingside castle blocked by friendly piece, queenside open
        for C in [5, 6]:
            gs_castle_u[r][C] = 8 if active == "blue" else 2
            valmoves_u = all_valid_moves(active, active, gs_castle_u, ep, hm)
            if ((r, 4), (r, 6)) in valmoves_u["other"]:
                print(
                    f"Incorrectly found invalid {active} kingside castle when {active} bishop obstructs kingside, all pieces unmoved"
                )
            if ((r, 4), (r, 2)) not in valmoves_u["other"]:
                print(
                    f"Failed to find valid {active} queenside castle when {active} bishop obstructs kingside, all pieces unmoved"
                )
            gs_castle_u[r][C] = 12

        # both kings have valid castles, make sure no infinite loops
        gs_castle_u = [[12] * 8 for ii in range(8)]
        gs_castle_u[0][7] = 3
        gs_castle_u[0][4] = 5
        gs_castle_u[7][7] = 9
        gs_castle_u[7][4] = 11
        valmoves_u = all_valid_moves(active, active, gs_castle_u, ep, hm)
        # print(valmoves_u)
        if ((r, 4), (r, 6)) not in valmoves_u["other"]:
            print(
                f"Failed to find valid {active} kingside castle when both kings have valid castles"
            )


if __name__ == "__main__":
    castle_test()
