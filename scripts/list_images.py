import sys, os

"""Read infos about the sprites and list them in a js file, db/pokes/images.js,
    for the webclient"""

def main(argv):
    path = ""
    if len(argv) <= 1:
        print ("format: python script/list_images.py po_image_folder")
        print ("input the image folder: ")
        path = sys.stdin.readline().strip()
    else:
        path = argv[1]

    for folder in ('', '/back/'):
        os.system('find ' + path + folder + '/* -prune -type f -name "*.png" -exec convert {} -print "{}:%w,%h\n" /dev/null \';\' > images.txt')
        os.system('find ' + path + '/animated/' + folder + '/* -prune -type f -name "*.gif" -exec convert {} -print "{}:%w,%h\n" /dev/null \';\' >> images.txt')

        return
        lines = open("images.txt", "r").readlines()
        images = {}

        for line in lines:
            ls = line.strip().split(':')
            num = ls[0].split('/')[-1].split('.')[0]

            if not num[0].isdigit():
                continue

            while num[0] == '0' and len(num) > 1:
                num = num[1:]

            if num.find('-') != -1:
                num = num.split('-')
                num = str(int(num[0]) + int(num[1]) * 65536)

            wh = ls[1].split(',')
            ext = ls[0][-3:]

            if ext == 'gif':
                images[num] = "{w:" + wh[0] + ",h:" + wh[1] + "}"
            else:
                images[num] = "{ext:'" + ext + "',w:" + wh[0] + ",h:" + wh[1] + "}"

        lines = []
        for k,v in images.items():
            line = k + ": " + v
            print (line)
            lines.append(line + ",\n")

        lines.sort()
        if len(folder) > 0:
            type = "." + folder[1:-1]
        else:
            type = ""
        output = open('db/pokes/images' + type + '.js', 'w')
        output.write("if(!pokedex.pokes)pokedex.pokes={};\n")
        if len(type) > 0:
            output.write("if(!pokedex.pokes.images)pokedex.pokes.images={};\n")
        output.write("pokedex.pokes.images"+type)
        output.write(" = {\n")
        output.writelines(lines)
        output.write("};")

if __name__ == "__main__":
    main(sys.argv)
