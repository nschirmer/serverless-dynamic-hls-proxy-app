'use strict';

const { Playlist, PlaylistTypeFilter, RenditionSortOrder, Chunklist, ChunklistPruneType } = require('dynamic-hls-proxy');
const express = require('express');
const sls = require('serverless-http');
const app = express();

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.get('/playlist_preview.m3u8', async (req, res, next) => {
    const playlistUrl = req.query.uri;
    const playlistUrlParts = playlistUrl.split('/');
        playlistUrlParts.pop();
    const baseUrl = playlistUrlParts.join('/') + '/';
    const maxDuration = req.query.maxDuration || 30;

    return Playlist.loadFromUrl(playlistUrl).then(function (playlist) {
        playlist
            .setTypeFilter(PlaylistTypeFilter.VideoOnly)
            .sortByBandwidth(RenditionSortOrder.nonHdFirst)
            .setLimit(1)
            .setBaseUrl(baseUrl)
            .useDynamicChunklists(true)
            .setDynamicChunklistEndpoint('chunklist.m3u8')
            .setDynamicChunklistProperties({
                pruneType: ChunklistPruneType.preview,
                maxDuration: maxDuration
            });

        return res.status(200).type('application/x-mpegURL').send(playlist.toString());
    });
});

app.get('/chunklist.m3u8', async (req, res, next) => {
    let baseUrl = req.query.baseUrl;
    const chunklistUri = req.query.uri;
    const chunklistUriParts = chunklistUri.split('/');
        chunklistUriParts.pop();
    const chunklistUrl = baseUrl + chunklistUri;

    if (chunklistUriParts.length > 0) {
        baseUrl += chunklistUriParts.join('/') + '/';
    }

    const pruneType = parseInt(req.query.pruneType, 10) || ChunklistPruneType.preview;
    const maxDuration = parseInt(req.query.maxDuration, 10) || 30;

    return Chunklist.loadFromUrl(chunklistUrl).then(function (chunklist) {
        chunklist
            .setBaseUrl(baseUrl)
            .setPruneType(pruneType)
            .setMaxDuration(maxDuration);
        
        return res.status(200).type('application/x-mpegURL').send(chunklist.toString());
    });
});

module.exports.server = sls(app)