var request = require('sync-request')
var cheerio = require('cheerio')
class Movie {
    constructor() {
        // 分别是电影名/评分/引言/排名/封面图片链接
        this.name = ''
        this.score = 0
        this.quote = ''
        this.ranking = 0
        this.coverUrl = ''
        this.otherNames = ''
    }
}
var log = console.log.bind(console)

var cachedUrl = url => {
    // 1, 确定缓存文件名
    var cacheFile = 'cached_html/' + url.split('?')[1] + '.html'
    // 2, 检查缓存文件是否存在
    // 如果存在就读取缓存文件
    // 如果不存在就下载并写入缓存文件
    var fs = require('fs')
    var exists = fs.existsSync(cacheFile)
    if (exists) {
        var data = fs.readFileSync(cacheFile)
        return data
    } else {
        var r = request('GET', url)
        var body = r.getBody('utf-8')
        fs.writeFileSync(cacheFile, body)
        return body
    }
}

var movieFromDiv = function(div) {
    var e = cheerio.load(div)
    var movie = new Movie()
    movie.name = e('.title').text()
    movie.score = e('.rating_num').text()
    movie.quote = e('.inq').text()
    let other = e('.other').text()
    movie.otherNames = other.slice(3).split(' / ').join('|')

    var pic = e('.pic')
    movie.ranking = pic.find('em').text()
    movie.coverUrl = pic.find('img').attr('src')

    return movie
}

var moviesFromUrl = function(url) {
    var body = cachedUrl(url)
    // cheerio.load 用来把 HTML 文本解析为一个可以操作的 DOM
    var e = cheerio.load(body)
    var movieDivs = e('.item')
    var movies = []
    for (var i = 0; i < movieDivs.length; i++) {
        var div = movieDivs[i]
        var m = movieFromDiv(div)
        movies.push(m)
    }
    return movies
}

var saveMovie = function(movies) {
    var s = JSON.stringify(movies, null, 2)
    var fs = require('fs')
    var path = 'douban.txt'
    fs.writeFileSync(path, s)
}

var downloadCovers = movies => {
    var request = require('request')
    var fs = require('fs')
    for (var i = 0; i < movies.length; i++) {
        var m = movies[i]
        var url = m.coverUrl
        var path = 'covers/' + m.name.split('/')[0] + '.jpg'
        request(url).pipe(fs.createWriteStream(path))
    }
}

var __main = function() {
    var movies = []
    for (var i = 0; i < 10; i++) {
        var start = i * 25
        var url = `https://movie.douban.com/top250?start=${start}&filter=`
        var moviesInPage = moviesFromUrl(url)
        movies = [...movies, ...moviesInPage]
    }
    saveMovie(movies)
    downloadCovers(movies)
}


__main()
