from bottle import route, run, static_file
import random

MAX_LEN = 6  # i.e. the maximum possible character repeats

#########
# Logic #
#########


def create_word_table(dict_filepath):
    words = {}
    with open(dict_filepath) as fp:
        words = fp.readlines()

    word_table = {}
    for word in words:
        word = word.strip().lower()
        if len(word) > MAX_LEN:
            continue

        word_hash = get_word_hash(word)

        if word_hash not in word_table.keys():
            word_table[word_hash] = set()
        word_table[word_hash].add(word)

    return word_table


def get_word_hash(word):
    # should be collision free up to anagrams
    hash = 0
    for char in word:
        char_val = 1 + ord(char) - ord('a')
        hash += int(MAX_LEN ** char_val)

    return hash


def all_subwords(word, word_table):
    subwords = set()

    for n in range(0, 2 ** len(word)):
        subword = ""

        for ix in range(0, len(word)):
            if n & (2 ** ix) > 0:
                subword += word[ix]

        hash = get_word_hash(subword)
        if(hash in word_table.keys()):
            subwords = subwords.union(word_table[hash])

    return list(subwords)


def get_word_options(word_table):
    result = []

    for words in word_table.values():
        for word in words:
            if len(word) == MAX_LEN:
                result.append(word)

    return result

word_table = create_word_table("data/scrabble_dict.txt")

#############
# Webserver #
#############


@route('/<filepath:path>')
def server_static(filepath):
    return static_file(filepath, root='./public/')


@route('/puzzle')
def get_puzzle():
    # select word
    word_options = get_word_options(word_table)
    index = random.randint(0, len(word_options) - 1)
    word = word_options[index]

    answers = all_subwords(word, word_table)

    answers.sort(key=lambda w: len(w))

    puzzle = {
        "word": word,
        "answers": answers
    }

    return puzzle


run(host='localhost', port=8080, debug=True)
