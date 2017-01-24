## Needs to be run in the db folder of the po installation

import sys
import os
import codecs
from distutils.dir_util import copy_tree

gens = ['7', '6', '5', '4', '3', '2', '1']

def removeUTF8Codec(line):
    #python 3
    if len(line) > 0 and ord(line[0]) == 65279:
        line = line[1:]
    if len(line) < len(codecs.BOM_UTF8):
        return line 
    #python 2
    for i in range(len(codecs.BOM_UTF8)):
        if line[i] != codecs.BOM_UTF8[i]:
            return line
    return line[len(codecs.BOM_UTF8):]

def ensure_dir(f):
    d = os.path.dirname(f)
    if not os.path.exists(d):
        os.makedirs(d)


def convert_line(line, duplicates):
    stripped = line.strip()
    if len(stripped) == 0:
        return ""
    lines = stripped.split(' ', 1)

    if duplicates != False:
        if not line in duplicates:
            duplicates.append(line)
        else:
            return ''

    nums = lines[0].split(':')
    if len(lines) > 1:
        if lines[1][0].isdigit():
            lines[1] = ",".join(lines[1].split(' '))
            if lines[1].find(",") != -1:
                lines[1] = "[" + lines[1] + "]"
        else:
            lines[1] = '"'+lines[1]+'"'
    else:
        lines.append('1')
    lines[0] = str(int(nums[0]) + int(nums[1])*65536)
    return lines[0] + ':'+lines[1]+',\n'


def deal_with_file(path, do_gens=False, file="", duplicates=False):
    print ("file: " + file)
    basefile = os.path.basename(file)
    full_moves = ''

    typepath = "pokedex.pokes"
    filepath = typepath+"."+basefile

    if do_gens:
        for gen in gens:
            try:
                all_moves_f = open(path + "/pokes/" + gen + "G/" + file + ".txt", "r");
                all_moves = all_moves_f.readlines()
                all_moves_f.close()
            except IOError:
                continue

            all_moves[0] = removeUTF8Codec(all_moves[0])

            all_moves = [convert_line(x, duplicates) for x in all_moves]
            full_moves += filepath + "[" + gen + "] = {\n" + ''.join(all_moves) + '};\n'
    else:
        try:
            all_moves_f = open(path + "/pokes/" + file + ".txt", "r");
            all_moves = all_moves_f.readlines()
            all_moves_f.close()
        except IOError:
            return

        all_moves[0] = removeUTF8Codec(all_moves[0])

        all_moves = [convert_line(x, duplicates) for x in all_moves]
        full_moves += filepath + " = {\n" + ''.join(all_moves) + '};'

    output_name = "db/pokes/"+ basefile + ".js"
    ensure_dir(output_name)

    print ("writing into " + output_name)
    output = open(output_name, "w");

    output.write("if(!"+typepath+")"+typepath+"={};\n")
    if do_gens:
        output.write("if(!"+filepath+")"+filepath+"=[];\n")

    output.write(full_moves)

    output.close()

def main(argv):
    path = ""
    if len(argv) <= 1:
        print ("format: python scripts/pokemon_converter po_db_folder")
        print ("input the po_db_folder: ")
        path = sys.stdin.readline().strip()
    else:
        path = argv[1]

    print ("Copying icons")
    copy_tree(path+"/pokes/icons", "app/assets/images/icons", update=1)
    print ("Icons copied over")
    for gen in gens:
        print ("Copying images from gen" + gen)
        copy_tree(path+"/pokes/" + gen + "G/sprites", "app/assets/images", update=1)
        print ("Images from gen" + gen + " copied over")

    print ("Copying cries")
    copy_tree(path+"/pokes/cries", "app/assets/sounds/cries", update=1)
    print ("Cries copied over")

    files = ['all_moves', 'type1', 'type2', 'ability1', 'ability2', 'ability3', 'min_levels', 'stats']
    base_files = ['gender', 'height', 'weight', 'pokemons', '../items/item_for_forme']
    unique_files = ['released']
    duplicates = {}

    for file in files:
        if not file in duplicates:
            duplicates[file] = []
        deal_with_file(path, do_gens=True, file=file, duplicates=duplicates[file])
    for file in unique_files:
        deal_with_file(path, do_gens=True, file=file)
    for file in base_files:
        deal_with_file(path, file=file)

if __name__ == "__main__":
    main(sys.argv)
