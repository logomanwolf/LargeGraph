var files = [
    'graph2vec_tsne_orign',
    'graph2vec_tsne_delta',
    'graph2vec_tsne_GEM',
    'graph2vec_pca_orign',
    'graph2vec_pca_delta',
    'graph2vec_pca_Gem',
    'graph2vec_id_tsne_orign',
    'graph2vec_id_tsne_delta',
    'graph2vec_id_tsne_GEM',
    'graph2vec_id_pca_orign',
    'graph2vec_id_pca_delta',
    'graph2vec_id_pca_Gem',
    'graphlets_tsne_orign',
    'graphlets_tsne_delta',
    'graphlets_tsne_GEM',
    'graphlets_pca_orign',
    'graphlets_pca_delta',
    'graphlets_pca_GEM',
]
files = [
    'graph2vec_pca_delta_0',
    'graph2vec_tsne_delta_0']

d3.select('body').append('div').attr('id', 'checkboxes')

var selectedFiles = new Set()

files.forEach(file => {
    d3.select('#checkboxes').append('input')
        .attr('type', 'checkbox')
        .attr('value', file)
        .text(file)
        .on('click', function (x) {
            if (!this.checked) {
                selectedFiles.delete(file)
            } else {
                selectedFiles.add(file)
            }
        })
    d3.select('#checkboxes').append('label')
        .attr('style', 'font-size: 24px')
        .text(file)
    d3.select('#checkboxes').append('br')
})

var container = d3.select('body').append('div')

d3.select('body').append('button').text('draw')
    .attr('style', 'position: absolute; font-size: 50px; top: 20px; left: 300px;')
    .on('click', function () {
        container.node().innerHTML = "";
        [...selectedFiles].forEach(file => {
            draw(file)
        })
    })

var container = d3.select('body').append('div')

function draw(dir) {
    d3.text('../data/' + dir, function (text) {
        console.log(text)
        var data = text.split('\n').filter(element => element.length > 0)
            .map((element, i) => {
                var coords = element.split(',')
                var d = {}
                if (coords.length == 1) {
                    d.y = coords[0]
                    d.x = i
                } else {
                    d.x = coords[0]
                    d.y = coords[1]
                }
                return d
            })
        console.log(data)

        var div = container.append('div')
            .attr('id', dir)
            .attr('style', 'display: inline-block; border: 2px solid gray')

        div.append('label').text(dir)
            .attr('style', 'position: absolute')

        var select = div.append('select')

        select.append('option')
            .attr('value', 0)
            .text('Encode by day&night')
        select.append('option')
            .attr('value', 1)
            .text('Encode by sequence')

        select.on('change', test)

        var svg = div.append('svg')
        var width = 750,
            height = 750,
            margin = 35
        svg.attr('width', width).attr('height', height)

        var xMin = Infinity,
            xMax = -Infinity,
            yMin = Infinity,
            yMax = -Infinity
        var lines = []
        for (var i = 0; i < data.length; i++) {
            var x = data[i].x,
                y = data[i].y
            xMin = Math.min(x, xMin)
            xMax = Math.max(x, xMax)
            yMin = Math.min(y, yMin)
            yMax = Math.max(y, yMax)
            if (i > 0) {
                lines.push({
                    x1: data[i - 1].x,
                    y1: data[i - 1].y,
                    x2: data[i].x,
                    y2: data[i].y
                })
            }
        }

        var xScale = d3.scale.linear()
                .domain([xMin, xMax])
                .range([margin, width - margin]),
            yScale = d3.scale.linear()
                .domain([yMin, yMax])
                .range([height - margin, margin])

        // create axis objects
        var xAxis = d3.svg.axis()
            .scale(xScale)
            .ticks(10)
            .orient('bottom')
        var yAxis = d3.svg.axis()
            .scale(yScale)
            .ticks(10)
            .orient('left')
        // Draw Axis
        var gX = svg.append('g')
            .attr('class', 'axis')
            .attr('transform', 'translate(' + 0 + ',' + (height - margin) + ')')
            .call(xAxis)
        var gY = svg.append('g')
            .attr('class', 'axis')
            .attr('transform', 'translate(' + margin + ')')
            .call(yAxis)


        // create a clipping region
        svg.append("defs").append("clipPath")
            .attr("id", "clip")
            .append("rect")
            .attr('x', margin)
            .attr('y', margin)
            .attr("width", width - margin * 2)
            .attr("height", height - margin * 2)

        var lineG = svg.append('g')
            .attr('class', 'lines')
            .attr('clip-path', 'url(#clip)')

        lineG.selectAll('.line')
            .data(lines)
            .enter()
            .append('line')
            .attr('class', 'line')
            .attr('x1', d => xScale(d.x1))
            .attr('y1', d => yScale(d.y1))
            .attr('x2', d => xScale(d.x2))
            .attr('y2', d => yScale(d.y2))

        var circleG = svg.append('g')
            .attr('class', 'points')
            .attr('clip-path', 'url(#clip)')

        var circles = circleG.selectAll('.point')
        var update = circles.data(data)
        update.enter()
            .append('circle')
            .attr('class', 'point')
            .attr('id', (d, i) => {
                return new Date(i * 6 * 60 * 1000 + 1353303380000).getHours() - 6.5
            })
            .attr('fill', (d, i) => {
                var hour = new Date(i * 6 * 60 * 1000 + 1353303380000).getHours() - 6.5
                if (hour < 6 || hour > 18) {
                    return 'black'
                } else {
                    return d3.scale.linear().domain([0, 0.5, 1]).range(['#fcd43f', '#e6372d', '#b12c39'])((hour - 6) / 12)
                }

                // return d3.scale.linear().domain([0, 0.5, 1]).range(['#fdfed6', '#3aafc3', '#081d5a'])(i / data.length)
            })
            .attr('cx', function (d) {
                return xScale(d.x)
            })
            .attr('cy', function (d) {
                return yScale(d.y)
            })
            .append('title')
            .text((d, i) => {
                return new Date(i * 6 * 60 * 1000 + 1353303380).getHours()
            })

        var zoomBehavior = d3.behavior.zoom()
            .x(xScale)
            .y(yScale)
            .on("zoom", zoom)

        svg.call(zoomBehavior)

        function zoom() {
            // update axes
            gX.call(xAxis)
            gY.call(yAxis)

            lineEles = lineG.selectAll('.line')
            lineUpdate = lineEles.data(lines)
            lineUpdate
                .attr('x1', d => xAxis.scale()(d.x1))
                .attr('y1', d => yAxis.scale()(d.y1))
                .attr('x2', d => xAxis.scale()(d.x2))
                .attr('y2', d => yAxis.scale()(d.y2))

            circles = circleG.selectAll('.point')
            update = circles.data(data)
            update.attr('cx', function (d) {
                return xAxis.scale()(d.x)
            })
                .attr('cy', function (d) {
                    return yAxis.scale()(d.y)
                })
        }

        function test() {
            if (+this.value) {
                circleG.selectAll('.point')
                    .attr('fill', (d, i) => {
                        return d3.scale.linear().domain([0, 0.5, 1]).range(['#fdfed6', '#3aafc3', '#081d5a'])(i / data.length)

                    })
            } else {
                circleG.selectAll('.point')
                    .attr('fill', (d, i) => {
                        var hour = new Date(i * 6 * 60 * 1000 + 1353303380000).getHours() - 6.5
                        if (hour < 6 || hour > 18) {
                            return 'black'
                        } else {
                            return d3.scale.linear().domain([0, 0.5, 1]).range(['#fcd43f', '#e6372d', '#b12c39'])((hour - 6) / 12)
                        }
                    })
            }
        }

    })
}