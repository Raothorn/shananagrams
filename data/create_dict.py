
MAX_LEN = 6
WORD_COUNT = 10000

master_dict = set()
with open("scrabble_dict.txt") as fp:
    for line in fp:
        master_dict.add(line.strip().lower())

result = []
with open("topwords.txt") as fp:
    for line in fp:
        word = line.strip().lower()

        if len(word) <= MAX_LEN and word in master_dict:
            result.append(word + "\n")

        if(len(result) > WORD_COUNT):
            break

with open("dictionary.txt", "w") as fp:
    fp.writelines(result)
