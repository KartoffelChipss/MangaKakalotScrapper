import { load } from 'cheerio'
import { Manga } from '../Classes'
import { IMangaSearchResponse } from '../Types'

function getVal(val : string) {
    let multiplier = val.substr(-1).toLowerCase();
    if (multiplier == "k")
        return parseFloat(val) * 1000;
    else if (multiplier == "m")
        return parseFloat(val) * 1000000;
}

export const parseSearcResults = (data: string): IMangaSearchResponse => {
    const $ = load(data)
    const searchResults: Manga[] = []
    const pageElements = $('.group_page')
    const currentPage = Number($(pageElements).find('.page_select').text())
    const totalPages = Number(
        ($(pageElements)
            .find('.page_blue.page_last')
            .text()
            .match(/(-\d+|\d+)/g) || ['1'])[0]
    )
    $('.story_item').each((i, el) => {
        const thumbnail =
            $(el).find('a > img').attr('src') || 'https://ww3.mangakakalot.tv/static/images/404-avatar.png'
        const detailsElement = $(el).find('.story_item_right')
        const nameAndSlugElement = detailsElement.find('h3 > a')
        const name = nameAndSlugElement.text().trim()
        const slug = nameAndSlugElement.attr('href')
        const id = slug ? slug.split('manga-')[1] : ''
        let author = ''
        let views = 0
        let lastUpdated = ''
        detailsElement.find('span').each((i, el) => {
            const text = $(el).text()
            if (text.includes('Author(s)')) author = text.replace('Author(s) : ', '').trim()
            if (text.includes('Updated')) lastUpdated = text.replace('Updated : ', '').trim()
            if (text.includes('View')) views = Number(getVal(text.replace('View : ', '').replace(/,/g, '').trim()))
        })
        searchResults.push(
            new Manga(name, id, author, views, lastUpdated, thumbnail, `https://ww3.mangakakalot.tv${slug || '/'}`)
        )
    })
    return {
        pagination: {
            currentPage,
            hasNextPage: totalPages > currentPage,
            totalPages
        },
        data: searchResults
    }
}
