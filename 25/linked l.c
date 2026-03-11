#include<stdio.h>
#include<stdlib.h>
struct node
{
    int data;
   struct node *next;
};
   void Insertbegin(struct node**, int);
   void Insertafter(struct node**, int,int);
   void Display(struct node**);
   struct node * Search(struct node **, int);
   void Delete(struct node**,int);
   struct node * FindPrevious(struct node **, int); 
void main()
{
   int value,element,ch;
    struct node *head=NULL;   // Initially List is empty - denoted by having the head pointing to NULL 
    
 do
{
    printf ("1. Insert begin\n");
    printf ("2.Insert after some data in the list\n");
    printf("3:Delete\n");
    printf("4.Display List\n");
    printf("5.Exit\n");
   printf("Enter your choice\n");
  scanf("%d",&ch);
  switch(ch)
{
case 1:
   printf("Enter the value to be inserted\n");
  scanf("%d",&value);
   Insertbegin(&head, value);
   break;
case 2:
   printf("Enter the value to be inserted\n");
  scanf("%d",&value);
  printf("Enter the data after which the new value to be inserted\n");
  scanf("%d",&element);
  Insertafter(&head,value,element);
  break;
 case 3:  
  printf("Enter the value to be deleted\n");
  scanf("%d",&value);
  Delete(&head,value);
  break; 
 case 4:  
  Display(&head);
  break;
 case 5:
  exit(0);
 }
}
while(ch<=5);
}
void Insertbegin(struct node **head_Addr, int value)
{
     //Create a node and initialize
     struct node *newnode=(struct node*)malloc(sizeof(struct node));
     newnode->data=value;
     newnode->next=NULL;
	// If list is empty
     if(*head_Addr==NULL)
           *head_Addr=newnode;
   else
  {
    newnode->next=*head_Addr;
    *head_Addr=newnode;
  }
}
void Insertafter(struct node **head_Addr, int value,int element)
{
  //Create a node and initialize
     struct node *newnode=(struct node*)malloc(sizeof(struct node));
    struct node *key;
     newnode->data=value;
     newnode->next=NULL;
	//Search for the element after which insertion should be made
     key=Search(head_Addr,element);
	
     if(key!=NULL)
    {    
         newnode->next=key->next;
         key->next=newnode;
  }
	//If no such element is present
   else
     printf("Search key is not present-Insertion not possible\n");
}

void Display(struct node** head_Addr)
{
    struct node *temp;
   temp=*head_Addr;
	//If list is empty
   if(temp==NULL)
     printf("The list is empty\n");
  else
  {
	//traverse the list till end and print
     while(temp!=NULL)
     {
       printf("%d\n",temp->data);
      temp=temp->next;
     }
  }
}

void Delete(struct node **head_Addr,int value)
{
   struct node *temp,*delnode;
   //Check if the list is empty
     if (*head_Addr==NULL)
	{
	   printf("List is empty");
	   return;
	}
   
   // Check if the node to be deleted is the first node
   if (value == (*head_Addr)->data)
	{
	  temp = *head_Addr;
	  *head_Addr = (*head_Addr)->next;
	  free(temp);
	  return;
	}
   //printf("Addr of Prev Node %p\n",temp);
   temp=FindPrevious(head_Addr,value); 
   if(temp!=NULL)
   {    
         delnode=temp->next; 
         temp->next=delnode->next;

   }
   else
     printf("Search key is not present-Deletion is not possible\n");

}

struct node* FindPrevious(struct node **head_Addr, int value)
{
    struct node *temp;
   
   temp=*head_Addr;
   //Initialize temporary pointer and move to the node which is previous of node with value
   while(temp!=NULL&&temp->next->data!=value)
     temp=temp->next;
   return temp;
}


struct node* Search(struct node **head_Addr, int value)
{
    struct node *temp;
   temp=*head_Addr;
   while(temp!=NULL&&temp->data!=value)
     temp=temp->next;
   return temp;
}