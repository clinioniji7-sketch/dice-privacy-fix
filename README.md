# Dice Privacy Fix

Módulo para Foundry VTT v14 que corrige a visibilidade das animações do Dice So Nice quando sistemas personalizados disparam rolagens por cards sem repassar corretamente a privacidade da rolagem.

## Requisito

- Foundry VTT v14
- Dice So Nice

## Instalação pelo Manifest

Use o arquivo `module.json` deste repositório como Manifest URL no Foundry VTT ou The Forge.

## Comportamento esperado

- Public Roll: animação visível para todos.
- GM Roll: animação restrita aos GMs e ao usuário que realizou a rolagem.
- Blind Roll: animação restrita aos GMs.
- Self Roll: animação restrita ao usuário que realizou a rolagem.
