import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// Default templates
const defaultTemplates = [
  {
    name: 'Voicemail Greeting',
    category: 'voicemail',
    content: 'Hello, you\'ve reached {company_name}. {agent_name} is unavailable at the moment. Please leave your name, number, and a brief message after the tone, and we\'ll return your call as soon as possible.',
    variables: JSON.stringify(['company_name', 'agent_name']),
    isDefault: true,
  },
  {
    name: 'IVR Main Menu',
    category: 'ivr',
    content: 'Welcome to {company_name}. For {department_1}, press 1. For {department_2}, press 2. For {department_3}, press 3. To speak with an operator, press 0.',
    variables: JSON.stringify(['company_name', 'department_1', 'department_2', 'department_3']),
    isDefault: true,
  },
  {
    name: 'Hold Message',
    category: 'hold',
    content: 'Thank you for holding. Your call is important to {company_name}. A representative will be with you shortly. Your estimated wait time is {wait_time}.',
    variables: JSON.stringify(['company_name', 'wait_time']),
    isDefault: true,
  },
  {
    name: 'After Hours',
    category: 'after_hours',
    content: '{company_name} is currently closed. Our business hours are {hours}. If this is an emergency, please {emergency_action}. Otherwise, please call back during business hours or leave a message after the tone.',
    variables: JSON.stringify(['company_name', 'hours', 'emergency_action']),
    isDefault: true,
  },
  {
    name: 'Holiday Greeting',
    category: 'holiday',
    content: 'Thank you for calling {company_name}. We are currently closed for {holiday}. We will reopen on {return_date}. We wish you a happy {holiday}!',
    variables: JSON.stringify(['company_name', 'holiday', 'return_date']),
    isDefault: true,
  },
]

export async function GET(_request: NextRequest) {
  try {
    const templates = await prisma.template.findMany({
      orderBy: [
        { isDefault: 'desc' },
        { category: 'asc' },
        { name: 'asc' },
      ],
    })

    // If no templates exist, create defaults
    if (templates.length === 0) {
      await prisma.template.createMany({
        data: defaultTemplates,
      })
      
      const newTemplates = await prisma.template.findMany({
        orderBy: [
          { isDefault: 'desc' },
          { category: 'asc' },
          { name: 'asc' },
        ],
      })
      
      return NextResponse.json(newTemplates)
    }

    return NextResponse.json(templates)
  } catch (error) {
    console.error('Templates fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, category, content, variables } = body

    if (!name || !category || !content) {
      return NextResponse.json(
        { error: 'Name, category, and content are required' },
        { status: 400 }
      )
    }

    const template = await prisma.template.create({
      data: {
        name,
        category,
        content,
        variables: JSON.stringify(variables || []),
        isDefault: false,
      },
    })

    return NextResponse.json(template)
  } catch (error) {
    console.error('Template create error:', error)
    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, name, category, content, variables } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      )
    }

    const template = await prisma.template.update({
      where: { id },
      data: {
        name,
        category,
        content,
        variables: JSON.stringify(variables || []),
      },
    })

    return NextResponse.json(template)
  } catch (error) {
    console.error('Template update error:', error)
    return NextResponse.json(
      { error: 'Failed to update template' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json()

    if (!id) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      )
    }

    // Don't allow deletion of default templates
    const template = await prisma.template.findUnique({
      where: { id },
    })

    if (template?.isDefault) {
      return NextResponse.json(
        { error: 'Cannot delete default templates' },
        { status: 400 }
      )
    }

    await prisma.template.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Template delete error:', error)
    return NextResponse.json(
      { error: 'Failed to delete template' },
      { status: 500 }
    )
  }
}