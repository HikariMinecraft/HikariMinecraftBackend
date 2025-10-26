import { VercelRequest, VercelResponse } from "@vercel/node";

import { handle as pingHandle } from './_commands/cping.js';

export default function (req:VercelRequest,res:VercelResponse){
    return res.status(500).json({error:'this api is not implemented'})
}

const commands : Record<string,Function> = {
    'ping':pingHandle
}

export function getCommands(){
    return commands;
}

export function getCommand(commandName:string){
    return commands[commandName];
}