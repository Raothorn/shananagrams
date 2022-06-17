var settings = {
    WIDTH: 800,
    HEIGHT: 600,
    NUM_TILES: 6
,
    TILE_SPACING: 10,
};

var bounds = {};
var items = {};
var anims = {};
var game;
var initialized = false;

function init(puzzleData) {
    initBounds();
    initItems();

    game = new Game(puzzleData.word, puzzleData.answers);
}

function initItems() {
    var score = new PointText(bounds.botBoard.bottomLeft + new Point(0, 50));
    score.content = "Score: 0";
    score.fillColor = 'black';
    score.fontSize = 32;
    items.score = score;

    anims.incorrectAnim = {isRunning: false, length: 0.1, time: 0.0, color:'red' };
}

//------------
//-- EVENTS --
//------------

function onFrame(event) {
    if (!initialized) return;

    if(anims.incorrectAnim.isRunning) {
        var anim = anims.incorrectAnim;

        if(anim.time >= anim.length) {
            anim.isRunning = false;

            for (var i = 0; i < settings.NUM_TILES; i++) {
                if(!game.bottomTiles[i]) continue;
                var tilePath = game.bottomTiles[i].tileGroup.children["tile_path"];
                tilePath.fillColor = anim.color;
                tilePath.fillColor.alpha = 0.0;
            }

            game.reset(false);
            return;
        }

        opacity = anim.time / anim.length;

        for (var i = 0; i < settings.NUM_TILES; i++) {
            if(!game.bottomTiles[i]) continue;
            var tilePath = game.bottomTiles[i].tileGroup.children["tile_path"];
            tilePath.fillColor = anim.color;
            tilePath.fillColor.alpha = opacity;
        }

        anim.time += event.delta;
    }
}

function startAnim(anim) {
    anim.isRunning = true;
    anim.time = 0.0;
}

function onMouseDown(event) {
    var point = event.downPoint;

    for (var i = 0; i < bounds.topBoardSquares.length; i++) {
        var tileBounds = bounds.topBoardSquares[i];

        if(tileBounds.contains(point)) {
            game.moveTopToBottom(i);
        }
    }
}

function onKeyDown(event) {
    function isAlpha(str) {
        return /^[a-zA-Z]*$/.test(str);
    }

    if(isAlpha(event.character)) {
        game.letterTyped(event.character);
    }

    if(event.key == 'backspace') {
        game.backspace();
    }

    if(event.key == 'enter') {
        game.reset(true);
    }

    if(event.key == 'space') {
        game.submitGuess();
    }
	  // When a key is pressed, set the content of the text item:
}

//---------
//-- GAME--
//---------
function Game(word, answers) {
    this.word = word;
    this.answers = answers;
    this.topTiles = [null, null, null, null, null, null];
    this.bottomTiles = [null, null, null, null, null, null];
    this.guesses = [];

    this.reset(true);
}

Game.prototype.reset = function(doShuffle) {
    var word = this.word;
    if(doShuffle) {
        word = shuffle(word);
        // Maintain shuffle
        this.word = word;
    }

    for(var i = 0; i < settings.NUM_TILES; i++) {
        if(this.topTiles[i]) {
            this.topTiles[i].tileGroup.remove();
        }
        if(this.bottomTiles[i]) {
            this.bottomTiles[i].tileGroup.remove();
        }

        this.topTiles[i] = null;
        this.bottomTiles[i] = null;
    }

    this.topTiles = [null, null, null, null, null, null];
    this.bottomTiles = [null, null, null, null, null, null];

    for (var i = 0; i < word.length; i++) {

        var tile = {};
        tile.letter = word[i];

        var tileBounds = bounds.topBoardSquares[i];

        var tilePath = new Path.Rectangle(bounds.topBoardSquares[i]);
        tilePath.strokeColor = "black";
        tilePath.fillColor = 'red';
        tilePath.fillColor.alpha = 0.0;
        tilePath.name = "tile_path";

        var letter = new PointText(tileBounds.topLeft);
        letter.justification = 'center';
        letter.fillColor = 'black';
        letter.content = word[i];
        letter.fontSize = 32;

        centerRect(tileBounds, letter.bounds);

        tile.tileGroup = new Group([tilePath, letter]);

        this.topTiles[i] = tile;
    }
};

Game.prototype.submitGuess = function() {
    var guess = this.currentGuess();

    if (guess == "") return;

    if(this.guesses.includes(guess)) {
        anims.incorrectAnim.color = 'yellow';
        startAnim(anims.incorrectAnim);
    }
    else if (this.answers.includes(guess)) {
        this.guesses.push(guess);
        this.reset();

        var score = this.guesses.length;
        items.score.content = "Score: " + score;
    }
    else {
        anims.incorrectAnim.color = 'red';
        startAnim(anims.incorrectAnim);
    }
};

Game.prototype.swapTiles = function(ix1, ix2) {
    tile1 = this.topTiles[ix1];
    tile2 = this.topTiles[ix2];

    //swap physical locations
    tile1Loc = tile1.tileGroup.position;
    tile2Loc = tile2.tileGroup.position;
    tile1Letter = tile1.letter;
    tile2Letter = tile2.letter;

    tile1.tileGroup.position = tile2Loc;
    tile2.tileGroup.position = tile1Loc;

    tile1.letter = tile2Letter;
    tile2.letter = tile1Letter;
};

Game.prototype.currentGuess = function() {
    var guess = "";
    for(var i = 0; i < this.bottomTiles.length; i++) {
        if(!this.bottomTiles[i]) break;

        guess += this.bottomTiles[i].letter;
    }
    return guess;
};

Game.prototype.letterTyped = function(letter) {
    var foundIndex = -1;
    for (var i = 0; i < this.topTiles.length; i++) {
        if(!this.topTiles[i]) continue;

        if(this.topTiles[i].letter == letter) {
            foundIndex = i;
            break;
        }
    }

    if(foundIndex == -1) return;

    this.moveTopToBottom(foundIndex);
};

Game.prototype.backspace = function() {
    var foundIndex = -1;
    for(var i = settings.NUM_TILES - 1; i >= 0; i--) {
        if(this.bottomTiles[i] != null) {
            foundIndex = i;
            break;
        }
    }

    if (foundIndex == -1) return;

    this.moveBottomToTop(foundIndex);
};

Game.prototype.moveTopToBottom = function(index) {
    var fromBounds = bounds.topBoardSquares[index];
    var fromTile = this.topTiles[index];

    var toIndex = -1;
    var toBounds = null;
    for (var i = 0; i < settings.NUM_TILES; i++) {
        if (this.bottomTiles[i] == null) {
            toIndex = i;
            toBounds = bounds.botBoardSquares[i];
            break;
        }
    }

    if (!toBounds) return;

    this.bottomTiles[toIndex] = fromTile;
    this.topTiles[index] = null;

    var toVec = toBounds.topLeft - fromBounds.topLeft;
    fromTile.tileGroup.position += toVec;
};

Game.prototype.moveBottomToTop = function(index) {
    var fromBounds = bounds.botBoardSquares[index];
    var fromTile = this.bottomTiles[index];

    var toIndex = -1;
    var toBounds = null;
    for (var i = 0; i < settings.NUM_TILES; i++) {
        if (this.topTiles[i] == null) {
            toIndex = i;
            toBounds = bounds.topBoardSquares[i];
            break;
        }
    }

    if (!toBounds) return;

    this.topTiles[toIndex] = fromTile;
    this.bottomTiles[index] = null;

    var toVec = toBounds.topLeft - fromBounds.topLeft;
    fromTile.tileGroup.position += toVec;
};
//------------
//-- Bounds --
//------------
function initBounds() {
    // Initialize letter spaces
    var gameBounds = new Rectangle(0, 0, settings.WIDTH, settings.HEIGHT);
    debugDrawRect(gameBounds);

    topBoard = innerRect(gameBounds,
                               {from: .02, to: .98},
                               {from: .02, to: .2}
                              );
    debugDrawRect(topBoard);

    topBoardSquares = placeSquares(topBoard, 6);

    var botBoard = topBoard.clone();
    botBoard.top += topBoard.height + 10;
    debugDrawRect(botBoard);

    botBoardSquares = placeSquares(botBoard, 6);

    bounds.topBoard = topBoard;
    bounds.topBoardSquares = topBoardSquares;
    bounds.botBoard = botBoard;
    bounds.botBoardSquares = botBoardSquares;
}

function placeSquares(boardRect, numSquares) {
    var spacing = settings.TILE_SPACING;
    var tileSize = boardRect.height - (2 * spacing);

    var tileRect = new Rectangle(0, 0,
                                 tileSize * numSquares + spacing * (numSquares - 1),
                                 tileSize
                                );

    centerRect(boardRect, tileRect);

    squares = [];
    for(var i = 0; i < numSquares; i++) {
        var x = i * (tileSize + spacing) + tileRect.left;
        var square = new Rectangle(x, tileRect.top, tileSize, tileSize);
        squares[i] = square;
    }
    return squares;
}

// pre: inner is smaller than outer
function centerRect(outer, inner) {
    var dw = outer.width - inner.width;
    var dh = outer.height - inner.height;

    var offset = new Point(dw / 2, dh / 2);
    inner.topLeft = outer.topLeft + offset;
}

function innerRect(rect, hRange, vRange) {
    // Following assumes top left of rect is origin
    var x1 = rect.width *  (hRange.from);
    var x2 = rect.width *  (hRange.to);
    var y1 = rect.height * (vRange.from);
    var y2 = rect.height * (vRange.to);

    var topLeft = new Point(x1, y1) + rect.topLeft;
    var size = new Size(x2 - x1, y2 - y1);

    return new Rectangle(topLeft, size);
}

function debugDrawRect(rect) {
    var path = new Path.Rectangle(rect);
    path.strokeColor = 'black';
}


$(document).ready(function(){
    $.get("puzzle", function(data, status){
        init(data);

        initialized = true;
    });
});

function shuffle(string) {
    array = Array.from(string);
    var currentIndex = array.length;

    // While there remain elements to shuffle.
    while (currentIndex != 0) {

        // Pick a remaining element.
        var randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        var temp = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temp;

    }

    return array.join("");
}
