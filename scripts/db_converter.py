## Needs to be run in the db folder of the po installation

import sys
import os
import codecs


def ensure_dir(f):
    d = os.path.dirname(f)
    if not os.path.exists(d):
        os.makedirs(d)

def removeUTF8Codec(line):
    line = line.replace("ï»¿", "")
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

def convert_line(line, duplicates):
    lines = line.strip().split(' ', 1)

    if duplicates != False:
        if not line in duplicates:
            duplicates.append(line)
        else:
            return ''

    if lines[0].find(':') != -1:
        nums = lines[0].split(':')
        lines[0] = str(int(nums[0]) + int(nums[1])*65536)

    if len(lines) > 1:
        if lines[1][0].isdigit() and (len(lines[1]) == 1 or lines[1][1].isdigit()) :
            lines[1] = ",".join(lines[1].split(' '))
            if lines[1].find(",") != -1:
                lines[1] = "[" + lines[1] + "]"
        else:
            lines[1] = '"'+lines[1].replace("\"", "\\\"") +'"'
    else:
        lines.append('true')

    return lines[0] + ':'+lines[1]+',\n'


def deal_with_file(path, do_gens=False, file="", type="pokes", duplicates=False):
    print ("file: " + file)
    gens = ['6', '5', '4', '3', '2', '1']
    full_moves = ''
    all_moves = ''

    typepath = "pokedex." + type
    filepath = typepath+"."+file

    if do_gens:
        for gen in gens:
            try:
                all_moves_f = open(path + "/" + type + "/" + gen + "G/" + file + ".txt", "r");
                all_moves = all_moves_f.readlines()
                all_moves_f.close()
            except IOError:
                continue

            all_moves[0] = removeUTF8Codec(all_moves[0])

            all_moves = [convert_line(x, duplicates) for x in all_moves]
            full_moves += filepath + "[" + gen + "] = {\n" + ''.join(all_moves) + '};\n'
    else:
        try:
            all_moves_f = open(path + "/" + type + "/" + file + ".txt", "r");
            all_moves = all_moves_f.readlines()
            all_moves_f.close()
        except IOError:
            return

        all_moves[0] = removeUTF8Codec(all_moves[0])

        all_moves = [convert_line(x, duplicates) for x in all_moves]
        full_moves += filepath + " = {\n" + ''.join(all_moves) + '};'

    output_name = "db/" + type + "/" + file + ".js"
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
        print ("format: python scripts/db_converter po_db_folder")
        print ("input the po_db_folder: ")
        path = sys.stdin.readline().strip()
    else:
        path = argv[1]

    types = {
        'moves': {
            'files': ['accuracy', 'effect', 'effect_chance', 'damage_class', 'power', 'pp', 'type'],
            'base_files': ['moves', 'move_message']
        },
        'abilities': {
            'base_files': ['abilities', 'ability_desc', 'ability_messages']
        },
        'items': {
            'unique_files': ['released_items', 'released_berries'],
            'base_files': ['items', 'berries', 'item_useful', 'item_messages', 'berry_messages', 'items_description', 'berries_description']
        },
        'types': {
            'base_files': ["types", "category"]
        },
        'categories': {
            'base_files': ['categories']
        },
        'natures': {
            'base_files': ['nature']
        },
        'status': {
            'base_files': ['stats', 'status']
        },
        'genders': {
            'base_files': ['genders']
        },
        'gens': {
            'base_files': ['versions', 'gens']
        }
    }
    duplicates = {}

    for type in types.keys():
        if 'files' in types[type]:
            for file in types[type]["files"]:
                if not file in duplicates:
                    duplicates[file] = []
                deal_with_file(path, do_gens=True, type=type, file=file, duplicates=duplicates[file])
        if 'unique_files' in types[type]:
            for file in types[type]["unique_files"]:
                deal_with_file(path, do_gens=True, type=type, file=file)
        if 'base_files' in types[type]:
            for file in types[type]["base_files"]:
                deal_with_file(path, type=type, file=file)

if __name__ == "__main__":
    main(sys.argv)
